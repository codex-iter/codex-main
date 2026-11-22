import asyncio
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import logging
import random
import aiohttp

log = logging.getLogger(__name__)

REQUEST_TIMEOUT = 15

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def retry_delay(retry_after: str | None, attempt: int) -> float:
    """Use a server-provided retry window, otherwise exponential backoff with jitter."""
    if retry_after:
        try:
            return max(0.0, float(retry_after))
        except ValueError:
            try:
                return max(0.0, (parsedate_to_datetime(retry_after) - datetime.now(timezone.utc)).total_seconds())
            except (TypeError, ValueError):
                pass
    return (2 ** attempt) + random.uniform(0, 0.5)

async def safe_fetch(
    session: aiohttp.ClientSession,
    url: str,
    *,
    method: str = "GET",
    headers: dict | None = None,
    json_body: dict | None = None,
    max_retries: int = 3,
) -> dict:
    """
    Thin async wrapper around aiohttp requests.
    - Always attaches BROWSER_HEADERS (merged with any extra headers).
    - Applies REQUEST_TIMEOUT via aiohttp.ClientTimeout.
    - Retries automatically on HTTP 429 Too Many Requests with exponential backoff.
    - Returns parsed JSON dict on success, empty dict on any error.
    """
    merged_headers = {**BROWSER_HEADERS, **(headers or {})}
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
    
    for attempt in range(max_retries):
        try:
            if method.upper() == "POST":
                async with session.post(
                    url, headers=merged_headers, json=json_body, timeout=timeout
                ) as resp:
                    if resp.status == 429:
                        log.warning("    HTTP 429 fetching %s (Attempt %d/%d) — Retrying...", url, attempt + 1, max_retries)
                        await asyncio.sleep(retry_delay(resp.headers.get("Retry-After"), attempt))
                        continue
                    resp.raise_for_status()
                    return await resp.json(content_type=None)
            else:
                async with session.get(
                    url, headers=merged_headers, timeout=timeout
                ) as resp:
                    if resp.status == 429:
                        log.warning("    HTTP 429 fetching %s (Attempt %d/%d) — Retrying...", url, attempt + 1, max_retries)
                        await asyncio.sleep(retry_delay(resp.headers.get("Retry-After"), attempt))
                        continue
                    resp.raise_for_status()
                    return await resp.json(content_type=None)
        except asyncio.TimeoutError:
            log.warning("    TIMEOUT fetching %s (Attempt %d/%d)", url, attempt + 1, max_retries)
            if attempt + 1 < max_retries:
                await asyncio.sleep(retry_delay(None, attempt))
                continue
            return {}
        except aiohttp.ClientResponseError as exc:
            if exc.status in (400, 404):
                log.info("    HTTP %s (Not Found) fetching %s", exc.status, url)
                return {}
            log.warning("    HTTP %s fetching %s (Attempt %d/%d) — %s", exc.status, url, attempt + 1, max_retries, exc.message)
            if exc.status in (500, 502, 503, 504) and attempt + 1 < max_retries:
                await asyncio.sleep(retry_delay(exc.headers.get("Retry-After") if exc.headers else None, attempt))
                continue
            return {}
        except Exception as exc:  # noqa: BLE001
            log.warning("    ERROR fetching %s (Attempt %d/%d) — %s", url, attempt + 1, max_retries, exc)
            if attempt + 1 < max_retries:
                await asyncio.sleep(retry_delay(None, attempt))
                continue
            return {}
            
    return {}

def _safe_int(value, default: int = 0) -> int:
    """Convert value to int, returning default on None / TypeError / ValueError."""
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default

def _safe_float(value, default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default

def clean_handle(handle: str | None) -> str:
    """Normalize member handles by removing URLs, leading/trailing whitespace, and leading @ symbols."""
    if not handle:
        return ""
    h = str(handle).strip()
    if h.startswith("http://") or h.startswith("https://"):
        try:
            from urllib.parse import urlparse
            parsed = urlparse(h)
            path_parts = [p for p in parsed.path.strip("/").split("/") if p]
            if path_parts:
                if path_parts[0] in ("u", "user", "users", "profile") and len(path_parts) > 1:
                    h = path_parts[1]
                else:
                    h = path_parts[0]
        except Exception:
            pass
    import re
    h = re.sub(r"^[@/]+|[/]+$", "", h).strip()
    return h
