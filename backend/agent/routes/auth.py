import secrets
import time
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..config import settings
from ..db import get_db
from ..models import User
from ..auth.spotify import (
    exchange_code,
    get_spotify_user,
    login_url,
    token_expiry_from_response,
)
from ..auth.session import SESSION_COOKIE, SESSION_MAX_AGE, create_session, get_current_user, get_current_user_optional
from ..models import Session as SessionModel

router = APIRouter(prefix="/api/auth")

# state -> created_at unix timestamp. Pruned on each access so abandoned
# OAuth flows don't accumulate forever.
_pending_states: dict[str, float] = {}
_STATE_TTL_SECONDS = 600


def _prune_expired_states() -> None:
    cutoff = time.time() - _STATE_TTL_SECONDS
    for s in [s for s, ts in _pending_states.items() if ts < cutoff]:
        _pending_states.pop(s, None)


@router.get("/login")
async def login():
    _prune_expired_states()
    state = secrets.token_hex(16)
    _pending_states[state] = time.time()
    return RedirectResponse(login_url(state))


@router.get("/callback")
async def callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _prune_expired_states()
    if state not in _pending_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    _pending_states.pop(state, None)

    token_data = await exchange_code(code)
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    expiry = token_expiry_from_response(token_data)

    profile = await get_spotify_user(access_token)
    spotify_id = profile["id"]
    display_name = profile.get("display_name") or spotify_id
    avatar_url = (profile.get("images") or [{}])[0].get("url")

    result = await db.execute(select(User).where(User.spotify_id == spotify_id))
    user = result.scalar_one_or_none()
    if user:
        user.access_token = access_token
        user.refresh_token = refresh_token
        user.token_expiry = expiry
        user.display_name = display_name
        user.avatar_url = avatar_url
    else:
        user = User(
            spotify_id=spotify_id,
            display_name=display_name,
            avatar_url=avatar_url,
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=expiry,
        )
        db.add(user)
    await db.commit()
    await db.refresh(user)

    session_id = await create_session(user.id, db)

    response = RedirectResponse(url=f"{settings.frontend_url}/callback")
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=SESSION_MAX_AGE,
    )
    return response


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "spotify_id": user.spotify_id,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
    }


@router.post("/logout")
async def logout(
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Full logout: clear all DB sessions for the user and wipe their stored
    Spotify tokens. Next login will require a fresh consent (enforced by
    show_dialog=true on the OAuth URL), which is the only way to pick up
    newly-added scopes.

    Works even when the session cookie is already invalid — in that case we
    just clear the cookie and return ok.
    """
    if user is not None:
        # Delete every session row for this user
        await db.execute(
            SessionModel.__table__.delete().where(SessionModel.user_id == user.id)
        )
        # Wipe the stored Spotify tokens so the next login starts clean
        user.access_token = ""
        user.refresh_token = ""
        await db.commit()

    response = JSONResponse({"ok": True})
    response.delete_cookie(SESSION_COOKIE, secure=settings.cookie_secure, samesite="lax", httponly=True)
    return response
