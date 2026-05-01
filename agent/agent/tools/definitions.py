TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_catalog",
            "description": (
                "Search Spotify's catalog for tracks matching a query. "
                "Use this to find songs by mood, genre, artist, or any combination. "
                "Returns a list of tracks with name, artist, uri, and preview URL."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query, e.g. 'rainy day indie folk' or 'upbeat morning pop'",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of results to return (1-50, default 20)",
                        "default": 20,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": (
                "Get Spotify track recommendations based on seed tracks, artists, or a mood query. "
                "Best for 'more like this' or personalized playlist requests. "
                "IMPORTANT: always pass BOTH seed_artist_ids AND seed_artist_names (from the upstream tool's result) — "
                "the endpoint uses multiple fallback paths and needs names in case IDs don't work. "
                "If you also have a mood or genre in mind (e.g. 'rainy chill indie'), pass it as query_hint."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "seed_track_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Up to 5 Spotify track IDs to seed recommendations",
                    },
                    "seed_artist_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Up to 5 Spotify artist IDs to seed recommendations",
                    },
                    "seed_artist_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Up to 5 artist NAMES (always pass these alongside seed_artist_ids — they come from top_artists/recent_artists in get_liked_songs/get_top_items/get_recently_played results). Used as fallback seeds when the primary recommendations endpoint is unavailable.",
                    },
                    "target_energy": {
                        "type": "number",
                        "description": "Target energy 0.0 (calm) to 1.0 (intense)",
                    },
                    "target_valence": {
                        "type": "number",
                        "description": "Target valence 0.0 (sad) to 1.0 (happy)",
                    },
                    "target_tempo": {
                        "type": "number",
                        "description": "Target tempo in BPM",
                    },
                    "query_hint": {
                        "type": "string",
                        "description": "Optional mood/genre search phrase used as a final fallback (e.g. 'rainy day chill indie', 'upbeat pop hits'). Provide this whenever the user's request mentions a mood, weather, or genre.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of recommendations (1-100, default 20)",
                        "default": 20,
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_tracks",
            "description": (
                "Display a curated list of tracks to the user as a rich card in the chat. "
                "Use this as the FINAL step after gathering tracks via search_catalog, get_recommendations, "
                "get_liked_songs, get_top_items, or get_recently_played. "
                "This REPLACES playlist creation — Spotify no longer lets this app create or modify playlists, "
                "so we hand the user a card with 'Play on Spotify' links per track. "
                "ALWAYS call this at the end of any 'make me a playlist' or 'recommend tracks' request."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Short title for the list, e.g. 'Rainy Day Mix' or 'Based on Your Top Artists'",
                    },
                    "description": {
                        "type": "string",
                        "description": "One-sentence summary of why these tracks were picked",
                    },
                    "tracks": {
                        "type": "array",
                        "description": "Pass the track dicts you already gathered from the previous tool's result. Each item should have at least: name, artist, image_url, spotify_url. Don't make these up — copy them from the prior tool result.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "artist": {"type": "string"},
                                "album": {"type": "string"},
                                "image_url": {"type": "string"},
                                "spotify_url": {"type": "string"},
                            },
                            "required": ["name"],
                        },
                    },
                },
                "required": ["title", "tracks"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_playlists",
            "description": "Get the user's Spotify playlists. Use this when they reference a playlist by name.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_playlist_tracks",
            "description": (
                "List the ACTUAL tracks of a NAMED Spotify playlist the user owns or follows. "
                "USE THIS (not analyze_playlist) when the user asks to 'list', 'show', 'see', or 'what's in' a specific playlist. "
                "The playlist_id must come from get_user_playlists first. "
                "Returns full track objects (name, artist, image_url, spotify_url) ready for show_tracks."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "playlist_id": {"type": "string", "description": "Spotify playlist ID"},
                    "limit": {"type": "integer", "description": "Max tracks to return (default 30, max 100). Keep this small unless the user explicitly asks for the full list.", "default": 30},
                },
                "required": ["playlist_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_playlist",
            "description": (
                "Profile a playlist's CHARACTER for 'analyze my [name] playlist', 'make me something like my [name]', "
                "'based on my [name] playlist', or 'vibe of my [name]' requests. Returns: "
                "top_artists, top_genres, top_genre_families (rap/pop/indie/lo-fi/...), "
                "top_languages (hindi/k-pop/english/spanish/...), character_summary "
                "(short string like 'rap-leaning, mostly hindi-language'), and seed IDs ready for get_recommendations. "
                "Does NOT return the song list — for that, use get_playlist_tracks. "
                "REQUIRES a real playlist_id from get_user_playlists; do NOT pass a playlist name. "
                "DO NOT use for liked songs or general taste analysis — those use get_liked_songs or get_top_items."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "playlist_id": {
                        "type": "string",
                        "description": "Spotify playlist ID (must come from get_user_playlists, not the user's text)",
                    },
                },
                "required": ["playlist_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_playback",
            "description": "Get what the user is currently playing on Spotify, including track and device info.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": (
                "Get current weather for the user's location. Coordinates are automatically "
                "provided from the user's device — call this with no arguments unless the user "
                "specifies a different city. Returns a mood keyword (e.g. 'rainy', 'sunny') and a summary."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude (auto-provided, omit unless overriding for a specific city)"},
                    "lon": {"type": "number", "description": "Longitude (auto-provided, omit unless overriding for a specific city)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_liked_songs",
            "description": (
                "Fetch the user's Liked Songs library (their saved tracks) and return top artists + seed IDs ready for get_recommendations. "
                "THIS is the correct tool for ANY mention of 'liked songs', 'saved songs', 'my library', "
                "'analyze my liked songs', or 'based on my liked songs'. "
                "Liked Songs is a separate Spotify feature — it is NOT a playlist and does NOT appear in get_user_playlists."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of liked songs to fetch (1-50, default 50)",
                        "default": 50,
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_items",
            "description": (
                "Get the user's top tracks and artists from their listening history. Returns seed IDs ready for get_recommendations. "
                "THIS is the correct tool for ANY mention of 'my music taste', 'analyze my taste', "
                "'based on my taste', 'my top songs', 'my top artists', 'favorite artists', or 'what I usually listen to'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "time_range": {
                        "type": "string",
                        "enum": ["short_term", "medium_term", "long_term"],
                        "description": "short_term=last 4 weeks, medium_term=last 6 months, long_term=all time. Default: medium_term",
                        "default": "medium_term",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of top items to return (1-20, default 10)",
                        "default": 10,
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recently_played",
            "description": (
                "Get the user's recently played tracks (up to 50). "
                "Returns seed IDs ready for get_recommendations. "
                "Use when the user asks 'what have I been listening to lately', "
                "'based on what I just played', or 'my recent listening'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of recent tracks to fetch (1-50, default 20)",
                        "default": 20,
                    },
                },
                "required": [],
            },
        },
    },
]
