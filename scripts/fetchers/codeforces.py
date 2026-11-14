import asyncio
import logging
import aiohttp
from .utils import _safe_int, BROWSER_HEADERS, REQUEST_TIMEOUT, retry_delay

log = logging.getLogger(__name__)

cf_semaphore = asyncio.Semaphore(1)

async def make_cf_request(session: aiohttp.ClientSession, url: str, max_retries: int = 3) -> dict:
    """
    Makes a request to Codeforces with exponential backoff on 429/503.
    Limits concurrency using a module-level semaphore and spaces requests two seconds apart.
    """
    for attempt in range(1, max_retries + 1):
        async with cf_semaphore:
            timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
            try:
                async with session.get(url, headers=BROWSER_HEADERS, timeout=timeout) as resp:
                    if resp.status in (429, 503):
                        log.warning("    Codeforces HTTP %s on %s (Attempt %d/%d)", resp.status, url, attempt, max_retries)
                        if attempt < max_retries:
                            await asyncio.sleep(retry_delay(resp.headers.get("Retry-After"), attempt))
                            continue
                        return {}
                    
                    # Graceful fallback for non-existent users
                    if resp.status in (400, 404):
                        log.info("    Codeforces HTTP %s for %s (Likely invalid handle)", resp.status, url)
                        return {}

                    resp.raise_for_status()
                    return await resp.json(content_type=None)
                    
            except asyncio.TimeoutError:
                log.warning("    TIMEOUT fetching %s", url)
                return {}
            except aiohttp.ClientResponseError as exc:
                log.warning("    HTTP %s fetching %s — %s", exc.status, url, exc.message)
                return {}
            except Exception as exc:  # noqa: BLE001
                log.warning("    ERROR fetching %s — %s", url, exc)
                return {}
            finally:
                # Codeforces permits one API request every two seconds.
                await asyncio.sleep(2.0)
                
    return {}

async def fetch_codeforces(session: aiohttp.ClientSession, handle: str) -> dict:
    """
    Fetches Codeforces metrics across three endpoints concurrently:
      1. user.info  -> current rating, max rating, rank title
      2. user.status -> count of distinct AC'd problems
      3. user.rating -> number of rated contests attended

    Returns: {
      codeforces_rating, codeforces_max_rating, codeforces_rank_title,
      codeforces_solved, cf_contests_attended
    }
    """
    import urllib.parse
    encoded_handle = urllib.parse.quote(handle)
    
    info_data, status_data, rating_data = await asyncio.gather(
        make_cf_request(session, f"https://codeforces.com/api/user.info?handles={encoded_handle}"),
        make_cf_request(session, f"https://codeforces.com/api/user.status?handle={encoded_handle}"),
        make_cf_request(session, f"https://codeforces.com/api/user.rating?handle={encoded_handle}"),
    )

    # 1. Profile info
    rating, max_rating, rank_title = 0, 0, "Unrated"
    if info_data and info_data.get("status") == "OK" and info_data.get("result"):
        r = info_data["result"][0]
        rating = _safe_int(r.get("rating"))
        max_rating = _safe_int(r.get("maxRating"))
        rank_title = r.get("rank") or "Unrated"

    # 2. Distinct solved problems
    solved: set = set()
    if status_data and status_data.get("status") == "OK":
        for sub in status_data.get("result", []):
            if sub.get("verdict") == "OK":
                prob = sub.get("problem", {})
                solved.add((prob.get("contestId"), prob.get("index")))

    # 3. Contest history -> count attended
    cf_contests = 0
    if rating_data and rating_data.get("status") == "OK":
        cf_contests = len(rating_data.get("result", []))

    result = {
        "codeforces_rating": rating,
        "codeforces_max_rating": max_rating,
        "codeforces_rank_title": rank_title,
        "codeforces_solved": len(solved),
        "cf_contests_attended": cf_contests,
        "_fetch_ok": any(
            data and data.get("status") == "OK"
            for data in (info_data, status_data, rating_data)
        ),
    }
    log.info("    ✓ Codeforces   -> %s", result)
    return result
