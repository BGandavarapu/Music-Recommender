import secrets
from datetime import datetime, timezone
from fastapi import Cookie, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_db
from ..models import Session, User


SESSION_COOKIE = "mr_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


async def create_session(user_id: int, db: AsyncSession) -> str:
    session_id = secrets.token_hex(32)
    session = Session(session_id=session_id, user_id=user_id)
    db.add(session)
    await db.commit()
    return session_id


async def get_current_user(
    mr_session: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not mr_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await db.execute(
        select(Session).where(Session.session_id == mr_session)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")
    result = await db.execute(select(User).where(User.id == session.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    session.last_seen = datetime.now(timezone.utc)
    await db.commit()
    return user


async def get_current_user_optional(
    mr_session: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    try:
        return await get_current_user(mr_session=mr_session, db=db)
    except HTTPException:
        return None
