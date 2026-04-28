import asyncio
import httpx
from collections import Counter

BASE = "https://api.spotify.com/v1"
TIMEOUT = 10
# Spotify caps /search limit at 10 for apps without extended quota mode.
SEARCH_MAX_LIMIT = 10


def _int(v, default: int) -> int:
    """Coerce to int — model sometimes passes numbers as strings ('20' vs 20)."""
    if v is None:
        return default
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _http_error_to_result(e: httpx.HTTPStatusError, operation: str) -> dict:
    """Convert an HTTPStatusError into a structured result dict with an agent-actionable hint."""
    code = e.response.status_code
    if code == 401:
        return {
            "error": "AUTH_EXPIRED",
            "hint": f"The user's Spotify session expired during {operation}. Tell the user their session expired and they need to reconnect Spotify.",
        }
    if code == 403:
        return {
            "error": "SCOPE_MISSING",
            "hint": (
                f"Spotify rejected {operation} (403 Forbidden). "
                "This endpoint may be restricted for apps in Development mode, or the user's token lacks the required scope. "
                "Try a different approach — e.g., use search_catalog with a descriptive query instead."
            ),
        }
    if code == 404:
        return {
            "error": "NOT_FOUND",
            "hint": f"{operation} returned 404 — the resource doesn't exist or the endpoint has been removed. If this is get_recommendations, use the artist top-tracks fallback automatically.",
        }
    if code == 429:
        return {
            "error": "RATE_LIMITED",
            "hint": f"Spotify rate-limited {operation}. Wait a moment and try a simpler approach or different tool.",
        }
    return {
        "error": f"HTTP_{code}",
        "hint": f"Spotify returned HTTP {code} on {operation}. Try a different approach or tell the user what failed.",
    }


def _network_error(e: Exception, operation: str) -> dict:
    return {
        "error": "NETWORK",
        "hint": f"Network issue during {operation}: {type(e).__name__}. Try again or use a different tool.",
    }


async def search_catalog(token: str, query: str, limit: int = 20) -> list[dict] | dict:
    limit = _int(limit, 20)
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{BASE}/search",
                headers=_headers(token),
                params={"q": query, "type": "track", "limit": min(limit, SEARCH_MAX_LIMIT)},
            )
            r.raise_for_status()
        items = r.json().get("tracks", {}).get("items", [])
        return [_format_track(t) for t in items if t]
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "search_catalog")
    except httpx.HTTPError as e:
        return _network_error(e, "search_catalog")


async def get_recommendations(
    token: str,
    seed_track_ids: list[str] | None = None,
    seed_artist_ids: list[str] | None = None,
    seed_artist_names: list[str] | None = None,
    target_energy: float | None = None,
    target_valence: float | None = None,
    target_tempo: float | None = None,
    query_hint: str | None = None,
    limit: int = 20,
) -> list[dict] | dict:
    """
    Multi-tier fallback chain for recommendations, since Spotify deprecated
    /v1/recommendations and /v1/artists/{id}/top-tracks for apps created after
    Nov 2024. Tries each endpoint in turn and returns the first batch of tracks.

    1. /recommendations (works for pre-Nov 2024 apps)
    2. /artists/{id}/top-tracks per seed (works for legacy apps)
    3. /search with artist:"Name" OR ... query (always works)
    4. /search with query_hint (e.g. mood keywords)
    """
    limit = _int(limit, 20)
    tracks: list[dict] = []
    seen: set[str] = set()

    def _add(t: dict) -> bool:
        tid = t.get("id")
        if tid and tid not in seen:
            tracks.append(_format_track(t))
            seen.add(tid)
        return len(tracks) >= limit

    # Attempt 1: original /recommendations endpoint
    try:
        params: dict = {"limit": min(limit, 100)}
        seeds = (seed_track_ids or [])[:5]
        artists = (seed_artist_ids or [])[:max(0, 5 - len(seeds))]
        if seeds: params["seed_tracks"] = ",".join(seeds)
        if artists: params["seed_artists"] = ",".join(artists)
        if not seeds and not artists: params["seed_genres"] = "pop"
        if target_energy is not None: params["target_energy"] = target_energy
        if target_valence is not None: params["target_valence"] = target_valence
        if target_tempo is not None: params["target_tempo"] = target_tempo
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(f"{BASE}/recommendations", headers=_headers(token), params=params)
        if r.status_code == 200:
            for t in r.json().get("tracks", []):
                if t and _add(t):
                    return tracks
            if tracks:
                return tracks
    except httpx.HTTPError:
        pass

    # Attempt 2: /artists/{id}/top-tracks per seed
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            for aid in (seed_artist_ids or [])[:5]:
                try:
                    r = await client.get(
                        f"{BASE}/artists/{aid}/top-tracks",
                        headers=_headers(token),
                        params={"market": "US"},
                    )
                    if r.status_code == 200:
                        for t in r.json().get("tracks", []):
                            if t and _add(t):
                                return tracks
                except httpx.HTTPError:
                    continue
        if tracks:
            return tracks
    except httpx.HTTPError:
        pass

    # Attempt 3: /search per-artist (OR-chains return 0 results on new-app quota,
    # so we query each artist name individually and merge)
    try:
        if seed_artist_names:
            names = [n for n in seed_artist_names if n][:5]
            per_artist = max(2, (limit // max(1, len(names))) + 1)
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                for name in names:
                    try:
                        r = await client.get(
                            f"{BASE}/search",
                            headers=_headers(token),
                            params={
                                "q": f'artist:"{name}"',
                                "type": "track",
                                "limit": min(per_artist, SEARCH_MAX_LIMIT),
                            },
                        )
                        if r.status_code == 200:
                            for t in r.json().get("tracks", {}).get("items", []):
                                if t and _add(t):
                                    return tracks
                    except httpx.HTTPError:
                        continue
            if tracks:
                return tracks
    except httpx.HTTPError:
        pass

    # Attempt 4: /search with a plain mood/genre hint
    try:
        if query_hint:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                r = await client.get(
                    f"{BASE}/search",
                    headers=_headers(token),
                    params={"q": query_hint, "type": "track", "limit": min(limit, SEARCH_MAX_LIMIT)},
                )
            if r.status_code == 200:
                for t in r.json().get("tracks", {}).get("items", []):
                    if t and _add(t):
                        return tracks
                if tracks:
                    return tracks
    except httpx.HTTPError:
        pass

    if not tracks:
        return {
            "error": "NO_RECOMMENDATIONS",
            "hint": "Couldn't get recommendations from any Spotify endpoint. Use search_catalog with a descriptive query (e.g. 'rainy day indie') instead.",
        }
    return tracks


async def show_tracks(
    token: str,
    title: str,
    tracks: list[dict],
    description: str = "",
) -> dict:
    """
    Build a TrackList card for the chat. Takes a list of track dicts that the agent
    already gathered from upstream tools (search_catalog, get_recommendations, etc.).

    No further Spotify API call is made — the upstream tools already returned all
    the metadata we need (name, artist, image_url, spotify_url). Spotify's /v1/tracks
    endpoint is blocked for apps in Development Mode, so re-fetching by URI doesn't work.
    """
    cards: list[dict] = []
    for t in (tracks or []):
        if not isinstance(t, dict):
            continue
        name = t.get("name", "")
        if not name:
            continue
        cards.append({
            "name": name,
            "artist": t.get("artist", ""),
            "album": t.get("album", ""),
            "image_url": t.get("image_url"),
            "spotify_url": t.get("spotify_url", ""),
        })
        if len(cards) >= 25:
            break

    if not cards:
        return {
            "error": "NO_TRACKS",
            "hint": "No valid track objects were passed. Pass the track dicts from the previous tool's result (each must have at least a 'name' field).",
        }

    return {
        "title": title,
        "description": description,
        "tracks": cards,
    }


async def get_user_playlists(token: str) -> list[dict] | dict:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{BASE}/me/playlists",
                headers=_headers(token),
                params={"limit": 50},
            )
            r.raise_for_status()
        return [
            {
                "id": p["id"],
                "name": p["name"],
                "track_count": p.get("tracks", {}).get("total", 0),
            }
            for p in r.json().get("items", [])
            if p
        ]
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "get_user_playlists")
    except httpx.HTTPError as e:
        return _network_error(e, "get_user_playlists")


def _extract_playlist_items(data: dict) -> tuple[list[dict], int]:
    """
    Pull the items array out of a /v1/playlists/{id} response, handling BOTH
    response shapes Spotify can return:

      - "Classic" shape:
            data["tracks"]["items"][i]["track"]   (track object)
            data["tracks"]["total"]
      - "Items" shape (returned to apps in Development Mode quota):
            data["items"]["items"][i]["item"]    (track-or-episode object)
            data["items"]["total"]  (or unspecified)

    Returns (list_of_track_objects, total_count_hint). Episodes and unplayable
    items are filtered out.
    """
    # Try classic shape
    track_block = data.get("tracks")
    if isinstance(track_block, dict) and isinstance(track_block.get("items"), list):
        raw = track_block["items"]
        track_field = "track"
        total = track_block.get("total") or 0
    else:
        # New "items" shape
        items_block = data.get("items")
        if isinstance(items_block, dict) and isinstance(items_block.get("items"), list):
            raw = items_block["items"]
            track_field = "item"
            total = items_block.get("total") or 0
        else:
            return [], 0

    out: list[dict] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        t = item.get(track_field)
        if not isinstance(t, dict):
            continue
        # Filter to actual tracks (skip podcast episodes etc.)
        if t.get("type") and t["type"] != "track":
            continue
        out.append(t)
    return out, total or len(out)


async def get_playlist_tracks(token: str, playlist_id: str, limit: int = 30) -> dict:
    """
    List the actual tracks of a playlist. Uses the whole-playlist endpoint
    /v1/playlists/{id} (which returns the items inline) instead of
    /v1/playlists/{id}/tracks, because the /tracks endpoint is blocked for
    apps in Development Mode.
    """
    limit = _int(limit, 100)
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{BASE}/playlists/{playlist_id}",
                headers=_headers(token),
                params={"market": "US"},
            )
            r.raise_for_status()
        data = r.json()
        track_objs, total = _extract_playlist_items(data)
        formatted = [_format_track(t) for t in track_objs[:limit]]
        return {
            "playlist_name": data.get("name", ""),
            "playlist_owner": ((data.get("owner") or {}).get("display_name") or ""),
            "track_count": total or len(formatted),
            "tracks": formatted,
        }
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "get_playlist_tracks")
    except httpx.HTTPError as e:
        return _network_error(e, "get_playlist_tracks")


async def analyze_playlist(token: str, playlist_id: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            # Use the whole-playlist endpoint (working) rather than /playlists/{id}/tracks
            # which is blocked by Spotify's Development Mode quota.
            r = await client.get(
                f"{BASE}/playlists/{playlist_id}",
                headers=_headers(token),
                params={"market": "US"},
            )
            r.raise_for_status()
            tracks, _total = _extract_playlist_items(r.json())
            track_ids = [t["id"] for t in tracks if t.get("id")]

            artist_counts: Counter = Counter()
            artist_id_map: dict[str, str] = {}
            for track in tracks:
                for artist in track.get("artists", []):
                    name = artist.get("name", "")
                    aid = artist.get("id", "")
                    if name:
                        artist_counts[name] += 1
                        if aid:
                            artist_id_map.setdefault(name, aid)

            features_list: list[dict] = []
            for chunk_start in range(0, len(track_ids), 100):
                chunk = track_ids[chunk_start : chunk_start + 100]
                try:
                    fr = await client.get(
                        f"{BASE}/audio-features",
                        headers=_headers(token),
                        params={"ids": ",".join(chunk)},
                    )
                    if fr.status_code == 200:
                        features_list.extend([f for f in fr.json().get("audio_features", []) if f])
                except httpx.HTTPError:
                    pass  # audio-features deprecated for new apps; keep analysis without it

        def avg(key: str) -> float | None:
            vals = [f[key] for f in features_list if f.get(key) is not None]
            return round(sum(vals) / len(vals), 3) if vals else None

        top_artist_names = [a for a, _ in artist_counts.most_common(5)]
        return {
            "track_count": len(track_ids),
            "top_artists": top_artist_names,
            "avg_tempo": avg("tempo"),
            "avg_energy": avg("energy"),
            "avg_valence": avg("valence"),
            "avg_danceability": avg("danceability"),
            "seed_track_ids": track_ids[:5],
            "seed_artist_ids": [artist_id_map[n] for n in top_artist_names if n in artist_id_map][:5],
        }
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "analyze_playlist")
    except httpx.HTTPError as e:
        return _network_error(e, "analyze_playlist")


async def get_liked_songs(token: str, limit: int = 50) -> dict:
    limit = _int(limit, 50)
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{BASE}/me/tracks",
                headers=_headers(token),
                params={"limit": min(limit, 50)},
            )
            r.raise_for_status()
        items = r.json().get("items", [])
        tracks: list[dict] = []
        artist_counts: Counter = Counter()
        artist_id_map: dict[str, str] = {}
        for item in items:
            t = item.get("track")
            if not t:
                continue
            tracks.append(_format_track(t))
            for a in t.get("artists", []):
                name = a.get("name", "")
                aid = a.get("id", "")
                if name:
                    artist_counts[name] += 1
                    if aid:
                        artist_id_map.setdefault(name, aid)
        top_names = [n for n, _ in artist_counts.most_common(5)]
        return {
            "track_count": len(tracks),
            "tracks": tracks[:20],
            "top_artists": top_names,
            "seed_track_ids": [t["id"] for t in tracks if t.get("id")][:5],
            "seed_artist_ids": [artist_id_map[n] for n in top_names if n in artist_id_map][:5],
        }
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "get_liked_songs")
    except httpx.HTTPError as e:
        return _network_error(e, "get_liked_songs")


async def get_top_items(token: str, time_range: str = "medium_term", limit: int = 10) -> dict:
    limit = min(_int(limit, 10), 20)
    params = {"limit": limit, "time_range": time_range}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            t_r, a_r = await asyncio.gather(
                client.get(f"{BASE}/me/top/tracks", headers=_headers(token), params=params),
                client.get(f"{BASE}/me/top/artists", headers=_headers(token), params=params),
            )
        t_r.raise_for_status()
        a_r.raise_for_status()
        top_tracks = [_format_track(t) for t in t_r.json().get("items", [])]
        top_artists = [
            {"id": a.get("id", ""), "name": a.get("name", ""), "genres": a.get("genres", [])[:3]}
            for a in a_r.json().get("items", [])
            if a.get("name")
        ]
        return {
            "top_tracks": top_tracks,
            "top_artists": top_artists,
            "seed_track_ids": [t["id"] for t in top_tracks if t.get("id")][:5],
            "seed_artist_ids": [a["id"] for a in top_artists if a.get("id")][:5],
        }
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "get_top_items")
    except httpx.HTTPError as e:
        return _network_error(e, "get_top_items")


async def get_recently_played(token: str, limit: int = 20) -> dict:
    limit = _int(limit, 20)
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{BASE}/me/player/recently-played",
                headers=_headers(token),
                params={"limit": min(limit, 50)},
            )
            r.raise_for_status()
        items = r.json().get("items", [])
        tracks: list[dict] = []
        artist_counts: Counter = Counter()
        artist_id_map: dict[str, str] = {}
        for item in items:
            t = item.get("track")
            if not t:
                continue
            tracks.append(_format_track(t))
            for a in t.get("artists", []):
                name = a.get("name", "")
                aid = a.get("id", "")
                if name:
                    artist_counts[name] += 1
                    if aid:
                        artist_id_map.setdefault(name, aid)
        top_names = [n for n, _ in artist_counts.most_common(5)]
        return {
            "track_count": len(tracks),
            "tracks": tracks[:20],
            "recent_artists": top_names,
            "seed_track_ids": [t["id"] for t in tracks if t.get("id")][:5],
            "seed_artist_ids": [artist_id_map[n] for n in top_names if n in artist_id_map][:5],
        }
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "get_recently_played")
    except httpx.HTTPError as e:
        return _network_error(e, "get_recently_played")


async def get_current_playback(token: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(f"{BASE}/me/player/currently-playing", headers=_headers(token))
        if r.status_code == 204 or not r.content:
            return {"playing": False}
        if r.status_code != 200:
            r.raise_for_status()
        data = r.json()
        track = data.get("item") or {}
        return {
            "playing": data.get("is_playing", False),
            "track": _format_track(track) if track else None,
            "device": (data.get("device") or {}).get("name"),
        }
    except httpx.HTTPStatusError as e:
        return _http_error_to_result(e, "get_current_playback")
    except httpx.HTTPError as e:
        return _network_error(e, "get_current_playback")


def _format_track(t: dict) -> dict:
    images = (t.get("album") or {}).get("images") or []
    # Spotify returns largest first; pick the smallest for chat thumbnails.
    image_url = images[-1].get("url") if images else None
    return {
        "uri": t.get("uri", ""),
        "id": t.get("id", ""),
        "name": t.get("name", ""),
        "artist": ", ".join(a.get("name", "") for a in t.get("artists", []) if a.get("name")),
        "album": (t.get("album") or {}).get("name", ""),
        "image_url": image_url,
        "preview_url": t.get("preview_url"),
        "spotify_url": (t.get("external_urls") or {}).get("spotify", ""),
    }
