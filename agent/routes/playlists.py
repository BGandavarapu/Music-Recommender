from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..auth.session import get_current_user
from ..auth.spotify import ensure_fresh_token
from ..db import get_db
from ..models import User
import httpx

router = APIRouter(prefix="/api/playlists")


@router.get("")
async def list_playlists(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token = await ensure_fresh_token(user, db)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://api.spotify.com/v1/me/playlists",
                headers={"Authorization": f"Bearer {token}"},
                params={"limit": 50},
            )
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="Spotify session expired")
        raise HTTPException(status_code=502, detail=f"Spotify returned {e.response.status_code}")
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Could not reach Spotify")
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "track_count": (p.get("tracks") or {}).get("total", 0),
            "image_url": (p.get("images") or [{}])[0].get("url"),
        }
        for p in data.get("items", [])
        if p
    ]
