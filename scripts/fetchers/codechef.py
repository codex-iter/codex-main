import asyncio
import logging
import re
import urllib.parse

import aiohttp

from .utils import BROWSER_HEADERS, REQUEST_TIMEOUT, _safe_int, retry_delay

log = logging.getLogger(__name__)

cc_semaphore = asyncio.Semaphore(1)

def _profile_metrics(html: str) -> dict:
    """Extract the public CodeChef profile metrics used by the leaderboard."""
    def number(pattern: str) -> int:
        match = re.search(pattern, html, re.DOTALL)
        return _safe_int(match.group(1).replace(",", "")) if match else 0

    return {
        "codechef_rating": number(r'id="rating-block-all".*?class="rating-number">\s*(\d+)'),
        "codechef_max_rating": number(r'id="rating-block-all".*?Highest Rating\s+([\d,]+)'),
        "codechef_solved": number(r'Total Problems Solved:\s*([\d,]+)'),
        "cc_contests_attended": number(r'No\. of Contests Participated:\s*<b>(\d+)</b>'),
    }


async def fetch_codechef(session: aiohttp.ClientSession, handle: str) -> dict:
    """Fetch leaderboard metrics from CodeChef's public profile page."""
    url = f"https://www.codechef.com/users/{urllib.parse.quote(handle, safe='')}"
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)

    failed_result = {**_profile_metrics(""), "_fetch_ok": False}

    async with cc_semaphore:
        try:
            for attempt in range(3):
                try:
                    async with session.get(
                        url, headers={**BROWSER_HEADERS, "Accept": "text/html"}, timeout=timeout
                    ) as response:
                        if response.status == 429:
                            log.warning("    HTTP 429 fetching %s (Attempt %d/3) — Retrying...", url, attempt + 1)
                            await asyncio.sleep(retry_delay(response.headers.get("Retry-After"), attempt))
                            continue
                        response.raise_for_status()
                        html = await response.text()
                        if "Total Problems Solved:" not in html:
                            log.warning("    CodeChef profile had no leaderboard metrics for %s", handle)
                            return failed_result
                        metrics = {**_profile_metrics(html), "_fetch_ok": True}
                        log.info("    ✓ CodeChef     -> rating=%d solved=%d", metrics["codechef_rating"], metrics["codechef_solved"])
                        return metrics
                except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
                    log.warning("    ERROR fetching %s — %s", url, exc)
                    return failed_result
        finally:
            await asyncio.sleep(2.0)

    return failed_result
