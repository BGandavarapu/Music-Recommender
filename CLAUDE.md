# Music Recommender — Agentic Playlist Assistant

A conversational AI music assistant powered by Claude. Users chat naturally to create Spotify playlists, discover songs, analyze their taste, and queue music — all matched to their mood and weather.

## Architecture

```
React + Vite + TypeScript (frontend)
   ├── /           → chat UI
   ├── /callback   → Spotify OAuth redirect handler
   └── /api/*  ──── proxy ────▶  Python FastAPI (:8000)
                                      │
                        ┌─────────────┴──────────────┐
                        │                            │
                  Claude agent                 Spotify Web API
               (tool_use loop)              (search, playlists,
                        │                    queue, analysis)
                   SQLite DB                       │
              (users, sessions,            Open-Meteo (weather)
               chat_history)
```

## Key files

| Path | Responsibility |
|---|---|
| `agent/main.py` | FastAPI app, middleware, route mounting, DB init |
| `agent/config.py` | Settings loaded from `agent/.env` via pydantic-settings |
| `agent/db.py` | SQLAlchemy async engine + `get_db` dependency |
| `agent/models.py` | User, Session, ChatMessage ORM models |
| `agent/auth/spotify.py` | OAuth2 flow, token exchange, token refresh |
| `agent/auth/session.py` | Session cookie: create/validate/resolve user |
| `agent/routes/auth.py` | `/api/auth/{login,callback,me,logout}` |
| `agent/routes/chat.py` | `POST /api/chat` → SSE stream from agent |
| `agent/routes/playlists.py` | `GET /api/playlists` → user's Spotify playlists |
| `agent/agent/brain.py` | Claude agentic loop: tool_use → dispatch → stream |
| `agent/agent/prompts.py` | System prompt defining agent persona |
| `agent/agent/tools/definitions.py` | Tool JSON schemas for Claude API |
| `agent/agent/tools/spotify_tools.py` | All Spotify API calls (search, create, queue, analyze) |
| `agent/agent/tools/weather_tools.py` | Open-Meteo → mood keyword |
| `src/App.tsx` | Auth gate → chat shell; OAuth callback handling |
| `src/hooks/useChat.ts` | SSE streaming, message history, loading state |
| `src/hooks/useAuth.ts` | `GET /api/auth/me`; user state |
| `src/components/chat/` | ChatWindow, ChatMessage, MessageInput, PlaylistCard |
| `src/components/auth/ConnectSpotify.tsx` | Landing / auth prompt screen |

## Design rules

- **No API keys required from users.** All third-party calls happen server-side. Spotify token lives in the DB.
- **Agent brain is stateless per request.** `brain.py` receives `messages` (full history) + Spotify token each call. No server-side session state in the agent itself.
- **SSE event protocol.** Frontend reads these event types from `/api/chat`: `text_delta`, `tool_status`, `playlist_created`, `done`, `error`.
- **Token refresh is automatic.** `auth/spotify.py::ensure_fresh_token()` is called before every tool dispatch. Always use this — never use `user.access_token` directly.
- **Tool dispatch lives in `brain.py::dispatch_tool()`** — single place to add/remove tools.

## Commands

```bash
# Backend
pip install -r agent/requirements.txt
cp agent/.env.example agent/.env   # fill in your keys
uvicorn agent.main:app --reload --port 8000

# Frontend
npm install
npm run dev           # runs both uvicorn + Vite concurrently

# Type-check frontend
npm run typecheck

# Build frontend for production
npm run build
```

## Environment variables (`agent/.env`)

| Key | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `SPOTIFY_CLIENT_ID` | developer.spotify.com → your app |
| `SPOTIFY_CLIENT_SECRET` | same |
| `SPOTIFY_REDIRECT_URI` | `http://localhost:5173/callback` (add to Spotify app settings) |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./agent.sqlite` (default) |

## Gotchas

- **Spotify redirect URI must match exactly.** In the Spotify Developer Dashboard, add `http://localhost:5173/callback` under Redirect URIs.
- **Queue requires active playback.** `add_to_queue` will 404 if no Spotify device is active. The agent handles this gracefully.
- **OAuth state in memory.** `_pending_states` in `routes/auth.py` is an in-process set — it will clear on server restart. This is fine for dev; for production use Redis or DB storage.
- **`analyze_playlist` calls `/audio-features`** which may return 403 if the app hasn't been approved for that scope — submit a quota extension request in the Spotify dashboard.
- **Geolocation for weather** is triggered by the agent when the user asks about weather without specifying a city. The frontend must ask for location and pass coordinates to the agent as part of the message context.
