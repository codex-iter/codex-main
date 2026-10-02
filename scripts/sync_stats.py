"""
CODEX Activity Tracker - Automated Stats Sync Pipeline
=======================================================
Runs twice daily via GitHub Actions to fetch platform metrics for all active
CODEX members and upsert a daily snapshot into Supabase.

Environment Variables Required:
    SUPABASE_URL              - Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (bypasses RLS)
    LEADERBOARD_GH_PAT        - GitHub Personal Access Token
"""

import logging
import os
import time
from datetime import datetime, timezone

import requests
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
REQUEST_TIMEOUT = 10          # seconds per external API call
INTER_CALL_SLEEP = 1.5        # seconds between platform calls (rate-limit courtesy)
GH_CONTRIBUTIONS_CAP = 500    # cap GitHub contributions to prevent padding exploit

# ---------------------------------------------------------------------------
# Supabase Client
# ---------------------------------------------------------------------------

def get_supabase_client() -> Client:
    """Initialize and return a Supabase client using environment variables."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
        )
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Platform Data Fetchers
# ---------------------------------------------------------------------------

def fetch_github(handle: str) -> dict:
    """
    Fetch GitHub contributions (current year) and public repo count via GraphQL.
    Returns: { github_contributions: int, github_repos: int }
    """
    token = os.environ.get("LEADERBOARD_GH_PAT", "")
    query = """
    query($login: String!) {
      user(login: $login) {
        repositories(privacy: PUBLIC) {
          totalCount
        }
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
    """
    headers = {
        "Authorization": f"bearer {token}",
        "Content-Type": "application/json",
    }
    resp = requests.post(
        "https://api.github.com/graphql",
        json={"query": query, "variables": {"login": handle}},
        headers=headers,
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    user = data.get("data", {}).get("user") or {}
    contributions = (
        user.get("contributionsCollection", {})
            .get("contributionCalendar", {})
            .get("totalContributions", 0)
    )
    repos = user.get("repositories", {}).get("totalCount", 0)
    return {
        "github_contributions": int(contributions),
        "github_repos": int(repos),
    }


def fetch_codeforces(handle: str) -> dict:
    """
    Fetch Codeforces current rating and count of distinct solved problems.
    Returns: { codeforces_rating: int, codeforces_solved: int }
    """
    # Rating
    info_resp = requests.get(
        f"https://codeforces.com/api/user.info?handles={handle}",
        timeout=REQUEST_TIMEOUT,
    )
    info_resp.raise_for_status()
    info_data = info_resp.json()
    rating = 0
    if info_data.get("status") == "OK" and info_data.get("result"):
        rating = info_data["result"][0].get("rating", 0) or 0

    time.sleep(INTER_CALL_SLEEP)

    # Solved problems (distinct AC submissions)
    status_resp = requests.get(
        f"https://codeforces.com/api/user.status?handle={handle}",
        timeout=REQUEST_TIMEOUT,
    )
    status_resp.raise_for_status()
    status_data = status_resp.json()
    solved = set()
    if status_data.get("status") == "OK":
        for submission in status_data.get("result", []):
            if submission.get("verdict") == "OK":
                problem = submission.get("problem", {})
                problem_key = (problem.get("contestId"), problem.get("index"))
                solved.add(problem_key)

    return {
        "codeforces_rating": int(rating),
        "codeforces_solved": len(solved),
    }


def fetch_leetcode(handle: str) -> dict:
    """
    Fetch LeetCode solved problem counts by difficulty.
    Returns: { leetcode_easy, leetcode_medium, leetcode_hard, leetcode_total }
    """
    resp = requests.get(
        f"https://leetcode-api-pied.vercel.app/user/{handle}/solved",
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "leetcode_easy": int(data.get("easySolved", 0) or 0),
        "leetcode_medium": int(data.get("mediumSolved", 0) or 0),
        "leetcode_hard": int(data.get("hardSolved", 0) or 0),
        "leetcode_total": int(data.get("totalSolved", 0) or 0),
    }


def fetch_codechef(handle: str) -> dict:
    """
    Fetch CodeChef current rating and total problems solved.
    Returns: { codechef_rating: int, codechef_solved: int }
    """
    resp = requests.get(
        f"https://codechef-stats.tashif.codes/{handle}",
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "codechef_rating": int(data.get("currentRating", 0) or 0),
        "codechef_solved": int(data.get("totalSolved", 0) or 0),
    }


def fetch_gfg(handle: str) -> dict:
    """
    Fetch GeeksforGeeks overall coding score and total problems solved.
    Returns: { gfg_score: int, gfg_solved: int }
    """
    resp = requests.get(
        f"https://gfg-stats.tashif.codes/{handle}",
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "gfg_score": int(data.get("score", 0) or 0),
        "gfg_solved": int(data.get("totalSolved", 0) or 0),
    }


def fetch_hackerrank(handle: str) -> dict:
    """
    Fetch HackerRank badge count.
    Returns: { hackerrank_badges: int }
    """
    resp = requests.get(
        f"https://hackerrank-stats.tashif.codes/{handle}",
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "hackerrank_badges": int(data.get("badgesCount", 0) or 0),
    }


# ---------------------------------------------------------------------------
# Scoring Formula
# ---------------------------------------------------------------------------

def calculate_score(snapshot: dict) -> float:
    """
    Calculate the unified CODEX score from a snapshot dict.
    Weights:
      LeetCode    : easy*1 + medium*3 + hard*6
      Codeforces  : solved*3 + max(0, rating-800)*0.5
      CodeChef    : solved*2 + max(0, rating-1000)*0.4
      GFG         : solved*1.5 + score*0.2
      GitHub      : min(contributions, 500) * 1.0
      HackerRank  : badges * 5
    """
    lc = (
        snapshot.get("leetcode_easy", 0) * 1
        + snapshot.get("leetcode_medium", 0) * 3
        + snapshot.get("leetcode_hard", 0) * 6
    )
    cf_rating = snapshot.get("codeforces_rating", 0) or 0
    cf = (
        snapshot.get("codeforces_solved", 0) * 3
        + max(0, cf_rating - 800) * 0.5
    )
    cc_rating = snapshot.get("codechef_rating", 0) or 0
    cc = (
        snapshot.get("codechef_solved", 0) * 2
        + max(0, cc_rating - 1000) * 0.4
    )
    gfg = (
        snapshot.get("gfg_solved", 0) * 1.5
        + snapshot.get("gfg_score", 0) * 0.2
    )
    gh = min(snapshot.get("github_contributions", 0), GH_CONTRIBUTIONS_CAP) * 1.0
    hr = snapshot.get("hackerrank_badges", 0) * 5

    return round(lc + cf + cc + gfg + gh + hr, 2)


# ---------------------------------------------------------------------------
# Platform Fetch Dispatcher
# ---------------------------------------------------------------------------

def safe_fetch(fetcher, handle: str, platform: str, defaults: dict) -> dict:
    """
    Safely calls a platform fetcher. On any exception, logs a warning and
    returns the provided default values to keep the sync loop running.
    """
    try:
        result = fetcher(handle)
        log.info("    ✓ %-12s -> %s", platform, result)
        return result
    except requests.exceptions.Timeout:
        log.warning("    ✗ %-12s -> Timed out (handle=%s). Using defaults.", platform, handle)
    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else "?"
        log.warning(
            "    ✗ %-12s -> HTTP %s error (handle=%s). Using defaults.", platform, status, handle
        )
    except Exception as exc:  # noqa: BLE001
        log.warning(
            "    ✗ %-12s -> Unexpected error (handle=%s): %s. Using defaults.",
            platform, handle, exc,
        )
    return defaults


# ---------------------------------------------------------------------------
# Main Sync Logic
# ---------------------------------------------------------------------------

def sync_member(member: dict, today: str) -> dict:
    """
    Fetch all platform metrics for a single member and build the snapshot dict.
    """
    member_id = member["id"]
    name = member.get("full_name", "Unknown")
    log.info("  Syncing member: %s (%s)", name, member_id)

    snapshot: dict = {
        "member_id": member_id,
        "snapshot_date": today,
        # Default all platform metrics to 0
        "github_contributions": 0,
        "github_repos": 0,
        "codeforces_rating": 0,
        "codeforces_solved": 0,
        "leetcode_easy": 0,
        "leetcode_medium": 0,
        "leetcode_hard": 0,
        "leetcode_total": 0,
        "codechef_rating": 0,
        "codechef_solved": 0,
        "gfg_score": 0,
        "gfg_solved": 0,
        "hackerrank_badges": 0,
        "total_score": 0.0,
    }

    # --- GitHub ---
    if handle := member.get("github_handle"):
        data = safe_fetch(fetch_github, handle, "GitHub", {"github_contributions": 0, "github_repos": 0})
        snapshot.update(data)
        time.sleep(INTER_CALL_SLEEP)

    # --- Codeforces ---
    if handle := member.get("codeforces_handle"):
        data = safe_fetch(fetch_codeforces, handle, "Codeforces", {"codeforces_rating": 0, "codeforces_solved": 0})
        snapshot.update(data)
        time.sleep(INTER_CALL_SLEEP)

    # --- LeetCode ---
    if handle := member.get("leetcode_handle"):
        defaults = {"leetcode_easy": 0, "leetcode_medium": 0, "leetcode_hard": 0, "leetcode_total": 0}
        data = safe_fetch(fetch_leetcode, handle, "LeetCode", defaults)
        snapshot.update(data)
        time.sleep(INTER_CALL_SLEEP)

    # --- CodeChef ---
    if handle := member.get("codechef_handle"):
        data = safe_fetch(fetch_codechef, handle, "CodeChef", {"codechef_rating": 0, "codechef_solved": 0})
        snapshot.update(data)
        time.sleep(INTER_CALL_SLEEP)

    # --- GeeksforGeeks ---
    if handle := member.get("gfg_handle"):
        data = safe_fetch(fetch_gfg, handle, "GFG", {"gfg_score": 0, "gfg_solved": 0})
        snapshot.update(data)
        time.sleep(INTER_CALL_SLEEP)

    # --- HackerRank ---
    if handle := member.get("hackerrank_handle"):
        data = safe_fetch(fetch_hackerrank, handle, "HackerRank", {"hackerrank_badges": 0})
        snapshot.update(data)
        time.sleep(INTER_CALL_SLEEP)

    # --- Compute Score ---
    snapshot["total_score"] = calculate_score(snapshot)
    log.info("  → Total Score: %.2f", snapshot["total_score"])

    return snapshot


def main():
    log.info("=" * 60)
    log.info("CODEX Stats Sync Pipeline — %s UTC", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    log.info("=" * 60)

    # Initialize Supabase client
    supabase = get_supabase_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Fetch all active members
    log.info("Fetching active members from Supabase...")
    response = supabase.table("members").select("*").eq("is_active", True).execute()
    members = response.data or []
    log.info("Found %d active member(s).", len(members))

    if not members:
        log.warning("No active members found. Exiting.")
        return

    success_count = 0
    fail_count = 0

    for member in members:
        try:
            snapshot = sync_member(member, today)

            # Upsert into activity_snapshots (conflict on member_id + snapshot_date)
            supabase.table("activity_snapshots").upsert(
                snapshot,
                on_conflict="member_id,snapshot_date",
            ).execute()
            log.info("  ✓ Upserted snapshot for %s\n", member.get("full_name", member["id"]))
            success_count += 1

        except Exception as exc:  # noqa: BLE001
            log.error(
                "  ✗ Failed to sync member %s: %s\n",
                member.get("full_name", member.get("id")),
                exc,
            )
            fail_count += 1
            # Continue with next member regardless
            continue

    log.info("=" * 60)
    log.info("Sync complete. Success: %d | Failed: %d", success_count, fail_count)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
