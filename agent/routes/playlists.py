from fastapi import APIRouter, Depends
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
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.spotify.com/v1/me/playlists",
            headers={"Authorization": f"Bearer {token}"},
            params={"limit": 50},
        )
        r.raise_for_status()
        data = r.json()
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "track_count": p["tracks"]["total"],
            "image_url": (p.get("images") or [{}])[0].get("url"),
        }
        for p in data.get("items", [])
        if p
    ]
