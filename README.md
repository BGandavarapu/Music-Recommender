# Music Recommender 🎵

An AI-powered music assistant. Chat with it to create Spotify playlists, discover songs by mood or weather, analyze your taste, and queue music — all in natural language.

> "Create a rainy day indie playlist"  
> "Analyze my Chill Vibes playlist and make something similar"  
> "Queue 5 upbeat tracks to get me going"

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Framer Motion
- **Backend:** Python + FastAPI + SQLAlchemy + SQLite
- **AI:** Claude (Anthropic) with tool_use — agentic loop
- **Music:** Spotify Web API (search, playlists, queue, audio analysis)
- **Weather:** Open-Meteo (keyless)

## Setup

### 1. Spotify Developer App

1. Go to [developer.spotify.com](https://developer.spotify.com) → Create an app
2. Add `http://localhost:5173/callback` as a Redirect URI
3. Copy your **Client ID** and **Client Secret**

### 2. Backend

```bash
cd agent
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
# Generate SECRET_KEY: python -c "import secrets; print(secrets.token_hex(32))"

pip install -r requirements.txt
```

### 3. Frontend

```bash
npm install
```

### 4. Run

```bash
npm run dev
```

Opens Vite at `http://localhost:5173`. The FastAPI backend runs on `:8000`. Vite proxies `/api/*` to it automatically.

## How it works

1. User connects their Spotify account via OAuth
2. The chat window opens — type anything
3. Claude receives the message + tool registry
4. Claude calls tools (search Spotify, check weather, create playlist…) until it has a full answer
5. Results stream back in real time via SSE
6. Playlists appear as clickable cards that open directly in Spotify

## Agent tools

| Tool | What it does |
|---|---|
| `search_catalog` | Search Spotify's 100M+ track catalog |
| `get_recommendations` | Spotify recommendations seeded from tracks/artists |
| `create_playlist` | Create a playlist in the user's library |
| `add_to_playlist` | Append tracks to an existing playlist |
| `add_to_queue` | Queue songs to the active Spotify device |
| `get_user_playlists` | List user's playlists |
| `analyze_playlist` | Extract taste profile (tempo, energy, mood, top artists) |
| `get_current_playback` | See what's currently playing |
| `get_weather` | Real weather → music mood via Open-Meteo |

## Adding more tools

1. Add the implementation in `agent/agent/tools/spotify_tools.py` (or a new file)
2. Add the JSON schema to `agent/agent/tools/definitions.py`
3. Add the dispatch case in `agent/agent/brain.py::dispatch_tool()`

## License

MIT
