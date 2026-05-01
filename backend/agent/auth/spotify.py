import time
from datetime import datetime, timezone, timedelta
import httpx
from ..config import settings

SCOPES = " ".join([
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
])

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
ME_URL = "https://api.spotify.com/v1/me"


def login_url(state: str) -> str:
    import urllib.parse
    params = {
        "client_id": settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri": settings.spotify_redirect_uri,
        "scope": SCOPES,
        "state": state,
        # Always force the consent dialog so new scopes actually get granted
        # when they're added to SCOPES. Without this, Spotify silently reuses
        # the last consent and the token never picks up new permissions.
        "show_dialog": "true",
    }
    return f"{AUTH_URL}?{urllib.parse.urlencode(params)}"


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.spotify_redirect_uri,
            },
            auth=(settings.spotify_client_id, settings.spotify_client_secret),
        )
        r.raise_for_status()
        return r.json()


async def refresh_access_token(refresh_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            TOKEN_URL,
            data={"grant_type": "refresh_token", "refresh_token": refresh_token},
            auth=(settings.spotify_client_id, settings.spotify_client_secret),
        )
        r.raise_for_status()
        return r.json()


async def get_spotify_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(ME_URL, headers={"Authorization": f"Bearer {access_token}"})
        r.raise_for_status()
        return r.json()


def token_expiry_from_response(data: dict) -> datetime:
    expires_in = int(data.get("expires_in", 3600))
    return datetime.now(timezone.utc) + timedelta(seconds=expires_in - 60)


async def ensure_fresh_token(user, db) -> str:
    """Return a valid access token, refreshing if needed. Mutates user in DB."""
    now = datetime.now(timezone.utc)
    expiry = user.token_expiry
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry > now:
        return user.access_token

    data = await refresh_access_token(user.refresh_token)
    user.access_token = data["access_token"]
    if "refresh_token" in data:
        user.refresh_token = data["refresh_token"]
    user.token_expiry = token_expiry_from_response(data)
    await db.commit()
    return user.access_token
