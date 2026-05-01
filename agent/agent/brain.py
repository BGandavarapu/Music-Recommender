import json
import logging
import re
from collections.abc import AsyncGenerator
from openai import AsyncOpenAI
from .prompts import SYSTEM_PROMPT
from .tools.definitions import TOOL_DEFINITIONS
from .tools import spotify_tools, weather_tools
from ..config import settings

log = logging.getLogger("agent")
client = AsyncOpenAI(api_key=settings.agent_api_key, base_url=settings.agent_base_url)

MAX_ITERATIONS = 20

# Intent-based routing: force the first tool call when the user's message clearly
# matches a known pattern. This bypasses the model's tool-selection when it's predictable.
INTENT_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # Playlist intents come FIRST: any phrase containing "playlist" is a playlist
    # request, even if it also mentions "music taste" or "top artists" (those words
    # would otherwise route to get_top_items and never visit the playlist).
    (re.compile(r"\b(my\s+playlists?|show\s+(me\s+)?my\s+playlists?|list\s+my\s+playlists?)\b", re.I), "get_user_playlists"),
    (re.compile(r"\b(list|show|see|what'?s\s+in|what\s+is\s+in|songs?\s+(in|from)|tracks?\s+(in|from))\b.*\bplaylist\b", re.I), "get_user_playlists"),
    # analyze / vibe-match a playlist → forced get_user_playlists so the model never
    # hallucinates a playlist_id (which caused the analyze_playlist 400s).
    (re.compile(r"\b(analyz[se]|look\s+at|based\s+on|something\s+like|like\s+my|vibe\s+of|profile\s+of)\b.*\bplaylist\b", re.I), "get_user_playlists"),
    (re.compile(r"\b(liked|saved)\s+songs?\b|\bmy\s+library\b", re.I), "get_liked_songs"),
    (re.compile(r"\b(top|favorite)\s+(songs?|tracks?|artists?)\b|\bmy\s+music\s+taste\b|\banalyze\s+my\s+taste\b|\bbased\s+on\s+(my\s+taste|what\s+i\s+listen)", re.I), "get_top_items"),
    (re.compile(r"\brecently\s+played\b|\bjust\s+listened\b|\b(what|songs?)\s+i('?ve)?\s+been\s+(listening|playing)\b|\bbeen\s+listening\s+to\s+lately\b", re.I), "get_recently_played"),
    # User asks what's currently playing
    (re.compile(r"\b(what'?s|what\s+is)\s+(currently|now|playing|on)\b|\bcurrently\s+playing\b|\bnow\s+playing\b|\bwhat('?s)?\s+playing\b", re.I), "get_current_playback"),
]

# Recognize tiny casual messages that should NOT trigger any tool. The model
# tends to over-trigger on these even with the prompt telling it to be casual.
CASUAL_PATTERN = re.compile(
    r"^\s*(hi|hello|hey|yo|sup|hiya|howdy|thanks?|thank\s+you|thx|ty|ok|okay|cool|nice|great|awesome|got\s+it|who\s+are\s+you|what\s+can\s+you\s+do|help)\b[\s.!?,]*$",
    re.I,
)


def is_casual_message(user_message: str) -> bool:
    return bool(CASUAL_PATTERN.match(user_message or ""))


# Detect malformed "tool-call-as-text" output that some models emit when we
# force tool_choice="none" but they still want to call a tool. Looks like:
#   {"name": "get_recommendations", "parameters": {...}}
TOOL_CALL_AS_TEXT_RE = re.compile(r'^\s*\{.*"(name|tool)"\s*:\s*"', re.S)


def forced_first_tool(user_message: str) -> str | None:
    for pattern, tool_name in INTENT_PATTERNS:
        if pattern.search(user_message):
            return tool_name
    return None


def _normalize_show_tracks_input(inputs: dict) -> dict:
    """
    Llama and other open-weight models pass `tracks` in surprising shapes:
      1. JSON-encoded string of an array — `"tracks": "[{...}, ...]"`
      2. Upstream result dict — `"tracks": {"track_count": N, "tracks": [...]}`
      3. List wrapping the upstream result — `"tracks": [{"tracks": [...], ...}]`
      4. Each entry encoded as a JSON string — `"tracks": ["{...}", "{...}"]`
    Normalize to a flat list[dict] so show_tracks can validate by name.
    """
    tracks = inputs.get("tracks")
    if tracks is None:
        return inputs

    if isinstance(tracks, str):
        try:
            tracks = json.loads(tracks)
        except (json.JSONDecodeError, TypeError):
            return inputs

    if isinstance(tracks, dict):
        for key in ("tracks", "top_tracks", "items"):
            inner = tracks.get(key)
            if isinstance(inner, list):
                tracks = inner
                break

    if isinstance(tracks, list):
        normalized: list = []
        for t in tracks:
            if isinstance(t, str):
                try:
                    parsed = json.loads(t)
                    if isinstance(parsed, dict):
                        normalized.append(parsed)
                except (json.JSONDecodeError, TypeError):
                    continue
            elif isinstance(t, dict):
                # Wrapper detection: an upstream-result dict with no track name
                # but a nested tracks list — flatten it.
                if "name" not in t and isinstance(t.get("tracks"), list):
                    for inner_t in t["tracks"]:
                        if isinstance(inner_t, dict):
                            normalized.append(inner_t)
                else:
                    normalized.append(t)
        tracks = normalized

    return {**inputs, "tracks": tracks}


async def dispatch_tool(
    name: str,
    inputs: dict,
    token: str,
    spotify_user_id: str,
    location=None,
    last_fetched_tracks: list[dict] | None = None,
) -> dict:
    log.info("tool_call name=%s inputs=%s", name, inputs)
    try:
        match name:
            case "search_catalog":
                return {"tracks": await spotify_tools.search_catalog(token, **inputs)}
            case "get_recommendations":
                return {"tracks": await spotify_tools.get_recommendations(token, **inputs)}
            case "show_tracks":
                inputs = _normalize_show_tracks_input(inputs)
                # Llama frequently passes "[]" or other garbage as tracks even when
                # the previous tool call returned a perfectly good track list. Fall
                # back to the cached tracks from the last data-fetch tool.
                tracks = inputs.get("tracks")
                if (not isinstance(tracks, list) or not tracks) and last_fetched_tracks:
                    log.info("show_tracks fallback to last_fetched_tracks count=%d", len(last_fetched_tracks))
                    inputs = {**inputs, "tracks": last_fetched_tracks}
                return await spotify_tools.show_tracks(token, **inputs)
            case "get_user_playlists":
                return {"playlists": await spotify_tools.get_user_playlists(token)}
            case "analyze_playlist":
                return await spotify_tools.analyze_playlist(token, **inputs)
            case "get_playlist_tracks":
                return await spotify_tools.get_playlist_tracks(token, **inputs)
            case "get_current_playback":
                return await spotify_tools.get_current_playback(token)
            case "get_weather":
                if location and "lat" not in inputs:
                    inputs = {"lat": location.lat, "lon": location.lon, **inputs}
                return await weather_tools.get_weather(**inputs)
            case "get_liked_songs":
                return await spotify_tools.get_liked_songs(token, **inputs)
            case "get_top_items":
                return await spotify_tools.get_top_items(token, **inputs)
            case "get_recently_played":
                return await spotify_tools.get_recently_played(token, **inputs)
            case _:
                return {"error": "UNKNOWN_TOOL", "hint": f"Tool {name} does not exist. Use one of the registered tools."}
    except (TypeError, KeyError, ValueError, AttributeError) as e:
        # Bad / missing / wrong-shape arguments from the model — tell it clearly
        return {
            "error": "BAD_ARGUMENTS",
            "hint": f"Tool {name} rejected the arguments: {type(e).__name__}: {e}. Check the tool's parameter schema and try again.",
        }


def _tool_result_has_error(result) -> tuple[bool, str | None]:
    """Returns (has_error, hint_or_none). Handles both dict and list returns."""
    if isinstance(result, dict) and "error" in result:
        return True, result.get("hint") or str(result.get("error"))
    # get_recommendations / search_catalog / get_user_playlists wrap results under a key
    if isinstance(result, dict):
        for key in ("tracks", "playlists"):
            inner = result.get(key)
            if isinstance(inner, dict) and "error" in inner:
                return True, inner.get("hint") or str(inner.get("error"))
    return False, None


async def run_agent(
    messages: list[dict],
    access_token: str,
    spotify_user_id: str,
    location=None,
) -> AsyncGenerator[str, None]:
    """
    Agentic loop using OpenAI-compatible API.
    Yields SSE-formatted event strings.
    Event types: text_delta, tool_status (status: running|done|error), tracks_ready, done, error
    """
    history: list = [{"role": "system", "content": SYSTEM_PROMPT}] + list(messages)

    # Determine if we should force a specific first tool based on user intent
    last_user = next((m for m in reversed(messages) if m.get("role") == "user"), None)
    last_user_text = last_user["content"] if last_user and isinstance(last_user.get("content"), str) else ""
    casual = is_casual_message(last_user_text)
    forced = None if casual else forced_first_tool(last_user_text)
    if casual:
        log.info("intent_routing casual=true")
    if forced:
        log.info("intent_routing forced_tool=%s", forced)

    last_tool_name: str | None = None
    last_fetched_tracks: list[dict] | None = None
    show_tracks_succeeded = False
    show_tracks_failures = 0
    MAX_SHOW_TRACKS_FAILURES = 2

    def _extract_tracks_for_cache(tool: str, result: object) -> list[dict] | None:
        """Pull the tracks array out of a data-fetch tool result, regardless of which key it lives under."""
        if not isinstance(result, dict):
            return None
        for key in ("tracks", "top_tracks"):
            val = result.get(key)
            if isinstance(val, list) and val and isinstance(val[0], dict) and val[0].get("name"):
                return val
        return None

    for iteration in range(MAX_ITERATIONS):
        # If show_tracks has failed repeatedly, the model is stuck in a loop —
        # bail out with a clear error rather than letting it lie about success.
        if show_tracks_failures >= MAX_SHOW_TRACKS_FAILURES:
            log.warning("show_tracks_terminal_failure attempts=%d", show_tracks_failures)
            yield _sse("error", {
                "text": "I gathered the tracks but couldn't display them. Try rephrasing your request — sometimes a slightly different phrasing helps.",
            })
            yield _sse("done", {})
            return

        tool_choice: str | dict = "auto"
        if iteration == 0 and casual:
            # Casual greeting/thanks — block tools so the model just replies briefly
            tool_choice = "none"
        elif iteration == 0 and forced:
            tool_choice = {"type": "function", "function": {"name": forced}}
        # Once show_tracks has delivered a result to the user, force the model
        # to write a final text reply instead of calling more tools (otherwise
        # some models loop show_tracks endlessly).
        elif show_tracks_succeeded:
            tool_choice = "none"

        try:
            response = await client.chat.completions.create(
                model=settings.agent_model,
                # 8192 tokens of headroom: long playlist queries can require
                # the model to write a 30-track show_tracks call which is
                # ~3-4 KB of JSON.
                max_tokens=8192,
                tools=TOOL_DEFINITIONS,  # type: ignore[arg-type]
                messages=history,
                tool_choice=tool_choice,  # type: ignore[arg-type]
            )
        except Exception as e:
            log.exception("llm_call_failed")
            yield _sse("error", {"text": f"Language model error: {type(e).__name__}. Try again in a moment."})
            yield _sse("done", {})
            return

        choice = response.choices[0]
        has_tool_calls = bool(choice.message.tool_calls)

        # Some providers (e.g. NVIDIA) return finish_reason="stop" even when forced
        # tool_calls are present. Treat presence of tool_calls as the source of truth.
        if not has_tool_calls:
            if choice.finish_reason == "stop":
                content = choice.message.content or ""
                # If the model emitted a tool-call-as-text (e.g. forced
                # tool_choice="none" but it still tried to call a tool),
                # replace with a sane default so the user doesn't see JSON.
                if TOOL_CALL_AS_TEXT_RE.match(content):
                    log.warning("model_emitted_tool_call_as_text len=%d", len(content))
                    # Best case: we have tracks cached from a prior data-fetch
                    # tool. The model probably tried to call show_tracks but
                    # serialized the args wrong. Render the cached tracks
                    # ourselves instead of dropping the whole response.
                    if not show_tracks_succeeded and last_fetched_tracks:
                        log.info("auto_emit_tracks_from_cache count=%d", len(last_fetched_tracks))
                        yield _sse("tracks_ready", {
                            "title": "Your mix",
                            "description": "",
                            "tracks": last_fetched_tracks[:25],
                        })
                        yield _sse("text_delta", {"text": "Here's your mix — click any track to play on Spotify."})
                        yield _sse("done", {})
                        return
                    if show_tracks_succeeded:
                        content = "Here you go — your mix is ready below. Click any track to play it on Spotify."
                    elif casual:
                        content = "Hey! What are you in the mood for? Tell me a vibe, a weather, or 'based on my liked songs'."
                    else:
                        content = "Sorry, I had trouble with that. Try rephrasing what you're looking for."
                yield _sse("text_delta", {"text": content})
                yield _sse("done", {})
                return

            if choice.finish_reason == "length":
                partial = choice.message.content or ""
                if partial:
                    yield _sse("text_delta", {"text": partial})
                yield _sse("error", {"text": "Response was cut off (max tokens reached). Try a simpler request."})
                yield _sse("done", {})
                return

            log.warning("unexpected_finish_reason reason=%s no_tool_calls", choice.finish_reason)
            yield _sse("error", {"text": f"Unexpected model state: {choice.finish_reason}. Try rephrasing your request."})
            yield _sse("done", {})
            return

        # Tool calls present — execute them
        history.append(choice.message)

        for tc in (choice.message.tool_calls or []):
            tool_name = tc.function.name
            last_tool_name = tool_name
            try:
                tool_input = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                log.warning("bad_tool_args tool=%s args=%s", tool_name, tc.function.arguments)
                tool_input = {}

            yield _sse("tool_status", {"tool": tool_name, "status": "running"})
            try:
                result = await dispatch_tool(
                    tool_name, tool_input, access_token, spotify_user_id, location,
                    last_fetched_tracks=last_fetched_tracks,
                )
            except Exception as e:
                log.exception("tool_dispatch_failed tool=%s", tool_name)
                result = {"error": "DISPATCH_FAILED", "hint": f"Tool {tool_name} crashed: {type(e).__name__}: {e}"}

            has_error, hint = _tool_result_has_error(result)
            log.info("tool_result tool=%s has_error=%s", tool_name, has_error)

            # Cache tracks from any successful data-fetch so show_tracks has a
            # fallback when the model fails to forward them correctly.
            if not has_error and tool_name in (
                "get_liked_songs", "get_top_items", "get_recently_played",
                "get_playlist_tracks", "get_recommendations", "search_catalog",
            ):
                fetched = _extract_tracks_for_cache(tool_name, result)
                log.info("cache_update tool=%s extracted=%d existing=%s",
                         tool_name, len(fetched) if fetched else 0,
                         len(last_fetched_tracks) if last_fetched_tracks else 0)
                if fetched:
                    last_fetched_tracks = fetched

            # Emit show_tracks success event so the UI renders the TrackListCard.
            if tool_name == "show_tracks" and isinstance(result, dict) and "tracks" in result and not has_error:
                yield _sse("tracks_ready", result)
                show_tracks_succeeded = True
            elif tool_name == "show_tracks" and has_error:
                show_tracks_failures += 1

            if has_error:
                yield _sse("tool_status", {"tool": tool_name, "status": "error", "message": hint or "Tool failed"})
            else:
                yield _sse("tool_status", {"tool": tool_name, "status": "done"})

            history.append({
                "role": "tool",
                "content": json.dumps(result, default=str),
                "tool_call_id": tc.id,
            })

    # Fell out of loop — hit MAX_ITERATIONS
    log.warning("max_iterations_reached last_tool=%s", last_tool_name)
    yield _sse("error", {
        "text": f"I got stuck after {MAX_ITERATIONS} steps" + (f" (last tool: {last_tool_name})" if last_tool_name else "") + ". Try a simpler request.",
    })
    yield _sse("done", {})


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
