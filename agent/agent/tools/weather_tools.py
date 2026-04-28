import httpx

WMO_MAP = {
    frozenset([95, 96, 99]): ("stormy", "Thunderstorm"),
    frozenset([71, 73, 75, 77, 85, 86]): ("snowy", "Snow"),
    frozenset([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]): ("rainy", "Rain"),
    frozenset([45, 48]): ("foggy", "Fog"),
}


def wmo_to_mood(code: int, is_day: bool, temp_c: float) -> tuple[str, str]:
    for codes, (mood, label) in WMO_MAP.items():
        if code in codes:
            return mood, label
    if not is_day:
        return "night drive", "Night"
    if code in (2, 3):
        return "cloudy", "Cloudy"
    if temp_c <= 5:
        return "chill", "Cold"
    if temp_c >= 28:
        return "upbeat", "Hot"
    return "sunny", "Clear"


async def get_weather(lat: float | None = None, lon: float | None = None) -> dict:
    if lat is None or lon is None:
        return {
            "error": "Location not available",
            "hint": "Ask the user to describe their current weather (e.g. 'it's raining') or which city to check, then use that mood directly without calling get_weather again.",
        }
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}&current_weather=true"
    )
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(url)
        r.raise_for_status()
    data = r.json()
    cw = data.get("current_weather", {})
    mood, label = wmo_to_mood(
        cw.get("weathercode", 0),
        cw.get("is_day", 1) == 1,
        cw.get("temperature", 20),
    )
    temp = round(cw.get("temperature", 0))
    return {"mood": mood, "summary": f"{label}, {temp}°C"}
