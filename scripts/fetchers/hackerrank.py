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
    encoded_handle = urllib.parse.quote(handle)
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

    result = {
        "hackerrank_badges": hr_badge_count,
        "hr_badges_list": hr_badges_list,
        "hr_topics": hr_topics,
        "_fetch_ok": bool(badges_payload or stats_resp),
    }
    log.info("    ✓ HackerRank   -> badges=%d", hr_badge_count)
    return result
