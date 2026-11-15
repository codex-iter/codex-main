import asyncio
import logging
import aiohttp
from .utils import safe_fetch, _safe_int, _safe_float

log = logging.getLogger(__name__)

lc_semaphore = asyncio.Semaphore(2)

async def fetch_leetcode(session: aiohttp.ClientSession, handle: str) -> dict:
    """
    Returns: {
      leetcode_easy, leetcode_medium, leetcode_hard, leetcode_total,
      leetcode_rating, leetcode_max_rating, lc_contests_attended, lc_badge_name, _lc_summary, _lc_badges_list
    }
    """
    import urllib.parse
    encoded_handle = urllib.parse.quote(handle)
    BASE = "https://leetcode-api-pied.vercel.app"

    query = """
    query userBadges($username: String!) {
        matchedUser(username: $username) {
            badges {
                name
                icon
            }
        }
    }
    """

    async with lc_semaphore:
        try:
            summary, contest_data, badges_resp = await asyncio.gather(
                safe_fetch(session, f"{BASE}/user/{encoded_handle}"),
                safe_fetch(session, f"{BASE}/user/{encoded_handle}/contests"),
                safe_fetch(session, "https://leetcode.com/graphql", method="POST", json_body={"query": query, "variables": {"username": handle}})
            )
        finally:
            await asyncio.sleep(1.0)

    # 1. Per-difficulty breakdown and Total Solved
    total = easy = medium = hard = 0
    try:
        ac_list = (
            summary.get("submitStats", {})
                   .get("acSubmissionNum", [])
        )
        for item in ac_list:
            diff = (item.get("difficulty") or "").lower()
            count = _safe_int(item.get("count"))
            if diff == "easy":
                easy = count
            elif diff == "medium":
                medium = count
            elif diff == "hard":
                hard = count
            elif diff == "all":
                total = count
        if easy + medium + hard > total:
            total = easy + medium + hard
    except Exception as exc:
        log.warning("    LeetCode difficulty breakdown unavailable for %s: %s", handle, exc)

    # 3. Contest history
    lc_contests = 0
    lc_rating = 0
    lc_max_rating = 0
    lc_badge = ""
    try:
        ranking = contest_data.get("userContestRanking") or {}
        lc_contests = _safe_int(ranking.get("attendedContestsCount"))
        current_rating = _safe_float(ranking.get("rating"))
        lc_rating = int(current_rating)
        lc_badge = (ranking.get("badge") or {}).get("name") or ""

        history = contest_data.get("userContestRankingHistory") or []
        history_ratings = [
            _safe_float(entry.get("rating"))
            for entry in history
            if entry.get("attended") is True
        ]
        lc_max_rating = int(max([current_rating] + history_ratings)) if history_ratings else int(current_rating)
    except Exception as exc:
        log.warning("    LeetCode contests unavailable for %s: %s", handle, exc)

    lc_badges_list = []
    try:
        user_data = badges_resp.get("data", {}).get("matchedUser", {}) or {}
        badges = user_data.get("badges") or []
        for b in badges:
            icon = b.get("icon")
            if icon and icon.startswith("/"):
                icon = "https://leetcode.com" + icon
            lc_badges_list.append({"name": b.get("name"), "icon": icon})
    except Exception as exc:
        log.warning("    LeetCode badges unavailable for %s: %s", handle, exc)

    result = {
        "leetcode_easy": easy,
        "leetcode_medium": medium,
        "leetcode_hard": hard,
        "leetcode_total": total,
        "leetcode_rating": lc_rating,
        "leetcode_max_rating": lc_max_rating,
        "lc_contests_attended": lc_contests,
        "lc_badge_name": lc_badge,
        "_lc_summary": summary,   # kept for topic aggregation in build_topic_stats
        "_lc_badges_list": lc_badges_list,
        "_fetch_ok": bool(summary or contest_data or badges_resp),
    }
    log.info("    ✓ LeetCode     -> easy=%d med=%d hard=%d total=%d contests=%d",
             easy, medium, hard, total, lc_contests)
    return result
