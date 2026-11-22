import asyncio
import logging
import aiohttp
from .utils import safe_fetch, _safe_int

log = logging.getLogger(__name__)

gfg_semaphore = asyncio.Semaphore(2)

async def fetch_gfg(session: aiohttp.ClientSession, handle: str) -> dict:
    """
    Fetches GFG metrics across four endpoints concurrently. All data inside `data: {}`.
    ...
    """
    import urllib.parse
    from .utils import clean_handle
    clean_h = clean_handle(handle)

    if not clean_h or " " in clean_h:
        log.warning("    Invalid GFG handle '%s' (handles cannot contain spaces)", handle)
        return {
            "gfg_solved": 0,
            "gfg_score": 0,
            "gfg_school": 0,
            "gfg_basic": 0,
            "gfg_easy": 0,
            "gfg_medium": 0,
            "gfg_hard": 0,
            "gfg_max_rating": 0,
            "gfg_topics": {},
            "_fetch_ok": False,
        }

    encoded_handle = urllib.parse.quote(clean_h)
    BASE = f"https://gfg-stats.tashif.codes/{encoded_handle}"

    async with gfg_semaphore:
        try:
            summary_payload, stats_resp, rating_resp = await asyncio.gather(
                safe_fetch(session, BASE),
                safe_fetch(session, f"{BASE}/stats"),
                safe_fetch(session, f"{BASE}/rating"),
            )
        finally:
            await asyncio.sleep(1.0)

    # 1. Summary
    summary_data = summary_payload.get("data") or {}
    solved = _safe_int(
        summary_data.get("totalSolved")
        or summary_payload.get("totalProblemsSolved")
    )

    # 2. Difficulty breakdown + topics
    stats_data = stats_resp.get("data") or {}
    by_diff = stats_data.get("byDifficulty") or {}
    gfg_school = _safe_int(by_diff.get("school"))
    gfg_basic  = _safe_int(by_diff.get("basic"))
    gfg_easy   = _safe_int(by_diff.get("easy"))
    gfg_medium = _safe_int(by_diff.get("medium"))
    gfg_hard   = _safe_int(by_diff.get("hard"))
    gfg_topics = {
        item["topic"]: item["count"]
        for item in stats_data.get("topicAnalysis", [])
        if item.get("topic")
    }

    # 3. Rating (may be null for non-contest users)
    rating_data = rating_resp.get("data") or {}
    _gfg_max_rating = _safe_int(rating_data.get("max"))

    # Use totalSolved as score
    score = solved

    is_valid = bool(
        summary_payload
        and isinstance(summary_payload, dict)
        and not summary_payload.get("error")
        and ("data" in summary_payload or "totalSolved" in summary_payload or "totalProblemsSolved" in summary_payload)
    )

    result = {
        "gfg_solved": solved,
        "gfg_score": score,
        "gfg_school": gfg_school,
        "gfg_basic": gfg_basic,
        "gfg_easy": gfg_easy,
        "gfg_medium": gfg_medium,
        "gfg_hard": gfg_hard,
        "gfg_max_rating": _gfg_max_rating,
        "gfg_topics": gfg_topics,
        "_fetch_ok": is_valid,
    }
    log.info("    ✓ GFG          -> solved=%d [S=%d B=%d E=%d M=%d H=%d]",
             solved, gfg_school, gfg_basic, gfg_easy, gfg_medium, gfg_hard)
    return result
