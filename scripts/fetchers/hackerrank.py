import asyncio
import logging
import aiohttp
from .utils import safe_fetch, _safe_int

log = logging.getLogger(__name__)

hr_semaphore = asyncio.Semaphore(2)

async def fetch_hackerrank(session: aiohttp.ClientSession, handle: str) -> dict:
    """
    Fetches HackerRank metrics across two endpoints concurrently.

    1. GET /{handle}/badges  -> { badges: [...], data: { count, list: [{id,name}] } }
    2. GET /{handle}/stats   -> { data: { topicAnalysis: [{topic, count}] } }

    Returns: {
      hackerrank_badges, hr_badges_list, hr_topics
    }
    """
    import urllib.parse
    from .utils import clean_handle
    clean_h = clean_handle(handle)

    if not clean_h or " " in clean_h:
        log.warning("    Invalid HackerRank handle '%s' (handles cannot contain spaces)", handle)
        return {
            "hackerrank_badges": 0,
            "hr_badges_list": [],
            "hr_topics": {},
            "_fetch_ok": False,
        }

    encoded_handle = urllib.parse.quote(clean_h)
    BASE = f"https://hackerrank-stats.tashif.codes/{encoded_handle}"

    async with hr_semaphore:
        try:
            badges_payload, stats_resp = await asyncio.gather(
                safe_fetch(session, f"{BASE}/badges"),
                safe_fetch(session, f"{BASE}/stats"),
            )
        finally:
            await asyncio.sleep(1.0)

    # 1. Badges
    badges_data = badges_payload.get("data") or {}
    hr_badge_count = _safe_int(
        badges_data.get("count")
        if badges_data.get("count") is not None
        else len(badges_payload.get("badges", []))
    )
    hr_badges_list = [
        {"id": b.get("id", ""), "name": b.get("name") or b.get("displayName", "")}
        for b in (badges_data.get("list") or badges_payload.get("badges") or [])
    ]

    # 2. Topic analysis from stats
    hr_topics = {}
    try:
        stats_data = stats_resp.get("data") or {}
        hr_topics = {
            item["topic"]: item["count"]
            for item in stats_data.get("topicAnalysis", [])
            if item.get("topic")
        }
    except Exception as exc:
        log.warning("    HackerRank topics unavailable for %s: %s", handle, exc)

    is_error = (
        badges_payload.get("status") == "error"
        or bool(badges_payload.get("error"))
        or "does not exist" in str(badges_payload.get("message", "")).lower()
        or "not found" in str(badges_payload.get("message", "")).lower()
    )
    is_valid = bool(
        badges_payload
        and isinstance(badges_payload, dict)
        and not is_error
        and (
            isinstance(badges_payload.get("data"), dict)
            or isinstance(badges_payload.get("badges"), list)
        )
    )

    result = {
        "hackerrank_badges": hr_badge_count,
        "hr_badges_list": hr_badges_list,
        "hr_topics": hr_topics,
        "_fetch_ok": is_valid,
    }
    log.info("    ✓ HackerRank   -> badges=%d", hr_badge_count)
    return result
