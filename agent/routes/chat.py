import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..auth.session import get_current_user
from ..auth.spotify import ensure_fresh_token
from ..db import get_db
from ..models import User
from ..agent.brain import run_agent

log = logging.getLogger("agent")
router = APIRouter(prefix="/api/chat")


class Location(BaseModel):
    lat: float
    lon: float


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    location: Optional[Location] = None


@router.post("")
async def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        token = await ensure_fresh_token(user, db)
    except Exception as e:
        log.exception("token_refresh_failed")
        # Force frontend to re-auth
        raise HTTPException(status_code=401, detail=f"Spotify token refresh failed: {type(e).__name__}")

    messages = list(req.history) + [{"role": "user", "content": req.message}]

    async def stream():
        try:
            async for chunk in run_agent(messages, token, user.spotify_id, req.location):
                yield chunk
        except Exception as e:
            log.exception("run_agent_crashed")
            err = json.dumps({"text": f"Server error: {type(e).__name__}. Please try again."})
            yield f"event: error\ndata: {err}\n\n"
            yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
