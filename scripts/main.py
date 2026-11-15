import asyncio
import logging
import subprocess
import re
from datetime import datetime, timezone
import aiohttp

from db import get_supabase_client, get_active_members, upsert_snapshot
from scoring import calculate_score
from fetchers import (
    fetch_github,
    fetch_codeforces,
    fetch_leetcode,
    fetch_codechef,
    fetch_gfg,
    fetch_hackerrank,
)
from fetchers.utils import REQUEST_TIMEOUT

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
CHUNK_SIZE        = 10           # members processed concurrently per batch
INTER_CHUNK_SLEEP = 3            # seconds to sleep between member chunks

# ---------------------------------------------------------------------------
# Snapshot Assembly: JSONB Aggregation
# ---------------------------------------------------------------------------

def sanitize_topic_map(topics: dict) -> dict:
    sanitized = {}
    ignore_pattern = re.compile(r"start\d+|_adm$|admin|cakewalk|simple", re.IGNORECASE)
    
    aliases = {
        "two-pointer-algorithm": "Two Pointers",
        "two pointers": "Two Pointers",
        "sieve": "Math",
    }
    
    for k, v in topics.items():
        if ignore_pattern.search(k):
            continue
        clean_k = aliases.get(k.lower(), k.replace("-", " ").title())
        sanitized[clean_k] = sanitized.get(clean_k, 0) + v
        
    return sanitized

def build_topic_stats(lc_summary: dict, cc_topics: dict, gfg_topics: dict, hr_topics: dict) -> dict:
    lc_topics = {}
    try:
        tag_counts = lc_summary.get("tagProblemCounts") or {}
        for section in ("advanced", "intermediate", "fundamental"):
            for item in tag_counts.get(section, []):
                name = item.get("tagName") or item.get("tagSlug", "")
                count = int(item.get("problemsSolved") or 0)
                if name:
                    lc_topics[name] = lc_topics.get(name, 0) + count
    except Exception:
        pass

    return {
        "leetcode": sanitize_topic_map(lc_topics),
        "codechef": sanitize_topic_map(cc_topics),
        "gfg": sanitize_topic_map(gfg_topics),
        "hackerrank": sanitize_topic_map(hr_topics),
    }

def build_badges_detail(lc_badges_list: list, lc_badge_name: str, hr_badges_list: list) -> list:
    badges = []
    for b in lc_badges_list:
        badges.append({"platform": "leetcode", "id": b.get("name", ""), "name": b.get("name", ""), "icon": b.get("icon")})
    if lc_badge_name and not any(b.get("name") == lc_badge_name for b in badges):
        badges.append({"platform": "leetcode", "id": "lc_badge", "name": lc_badge_name})
    for b in hr_badges_list:
        badges.append({"platform": "hackerrank", "id": b.get("id", ""), "name": b.get("name", "")})
    return badges


# ---------------------------------------------------------------------------
# Async Per-Member Sync
# ---------------------------------------------------------------------------

def calculate_total_activity(snapshot: dict) -> int:
    return (
        snapshot.get("leetcode_total", 0) +
        snapshot.get("codeforces_solved", 0) +
        snapshot.get("codechef_solved", 0) +
        snapshot.get("gfg_solved", 0) +
        snapshot.get("hackerrank_badges", 0) +
        snapshot.get("github_contributions", 0) +
        snapshot.get("github_prs", 0) +
        snapshot.get("github_issues", 0)
    )

async def sync_member_async(supabase_client, session: aiohttp.ClientSession, member: dict, today: str) -> dict:
    member_id = member["id"]
    name = member.get("full_name", "Unknown")
    log.info("  → Syncing: %s (%s)", name, member_id)

    snapshot = {
        "member_id": member_id,
        "snapshot_date": today,
        "raw_github_commits": 0, "valid_github_commits": 0,
        "github_contributions": 0, "github_repos": 0, "github_prs": 0, "github_issues": 0,
        "codeforces_rating": 0, "codeforces_solved": 0, "codeforces_max_rating": 0, "codeforces_rank_title": "Unrated",
        "leetcode_easy": 0, "leetcode_medium": 0, "leetcode_hard": 0, "leetcode_total": 0,
        "leetcode_rating": 0, "leetcode_max_rating": 0,
        "codechef_rating": 0, "codechef_solved": 0, "codechef_max_rating": 0,
        "gfg_score": 0, "gfg_solved": 0,
        "gfg_school": 0, "gfg_basic": 0, "gfg_easy": 0, "gfg_medium": 0, "gfg_hard": 0,
        "hackerrank_badges": 0,
        "total_score": 0.0, "dsa_score": 0.0, "dev_score": 0.0,
        "active_days": 0, "current_streak": 0, "max_streak": 0, "total_submissions": 0,
        "contests_attended": 0, "leetcode_contests": 0, "codeforces_contests": 0, "codechef_contests": 0,
        "topic_stats": {}, "badges_detail": [],
    }

    gh_handle  = member.get("github_handle")
    cf_handle  = member.get("codeforces_handle")
    lc_handle  = member.get("leetcode_handle")
    cc_handle  = member.get("codechef_handle")
    gfg_handle = member.get("gfg_handle")
    hr_handle  = member.get("hackerrank_handle")

    async def _noop() -> dict: return {}

    gh_data, cf_data, lc_data, cc_data, gfg_data, hr_data = await asyncio.gather(
        fetch_github(session, gh_handle) if gh_handle else _noop(),
        fetch_codeforces(session, cf_handle) if cf_handle else _noop(),
        fetch_leetcode(session, lc_handle) if lc_handle else _noop(),
        fetch_codechef(session, cc_handle) if cc_handle else _noop(),
        fetch_gfg(session, gfg_handle) if gfg_handle else _noop(),
        fetch_hackerrank(session, hr_handle) if hr_handle else _noop(),
        return_exceptions=False,
    )

    _lc_badges_list = []; _lc_badge_name = ""; _hr_badges_list = []
    _cc_topics = {}; _gfg_topics = {}; _hr_topics = {}; _lc_summary = {}
    _cf_contests = 0; _lc_contests = 0; _cc_contests = 0

    from db import get_recent_snapshots
    from datetime import datetime, timedelta
    
    today_date = datetime.strptime(today, "%Y-%m-%d").date()
    yesterday_str = (today_date - timedelta(days=1)).strftime("%Y-%m-%d")
    
    recent_snapshots = get_recent_snapshots(supabase_client, member_id, today, limit=2)
    yesterday_snap = recent_snapshots[0] if len(recent_snapshots) > 0 else None
    day_before_snap = recent_snapshots[1] if len(recent_snapshots) > 1 else None

    if not yesterday_snap:
        failed_platforms = [
            platform
            for platform, handle, data in (
                ("GitHub", gh_handle, gh_data), ("Codeforces", cf_handle, cf_data),
                ("LeetCode", lc_handle, lc_data), ("CodeChef", cc_handle, cc_data),
                ("GFG", gfg_handle, gfg_data), ("HackerRank", hr_handle, hr_data),
            )
            if handle and not data.get("_fetch_ok")
        ]
        if failed_platforms:
            log.warning("  ⏭ Skipping initial snapshot for %s; unavailable: %s", name, ", ".join(failed_platforms))
            return {"_skip_sync": True}

    if gh_handle and gh_data:
        gh_commits = gh_data.get("github_contributions", 0)
        gh_repos = gh_data.get("github_repos", 0)
        gh_prs = gh_data.get("github_prs", 0)
        gh_issues = gh_data.get("github_issues", 0)

        # Commits & Repos from GraphQL
        if yesterday_snap and (not gh_data.get("_gql_ok", gh_data.get("_fetch_ok")) or gh_commits < yesterday_snap.get("raw_github_commits", 0)):
            snapshot["github_contributions"] = yesterday_snap.get("raw_github_commits", 0)
            snapshot["github_repos"] = yesterday_snap.get("github_repos", 0)
        else:
            snapshot["github_contributions"] = gh_commits
            snapshot["github_repos"] = gh_repos

        # PRs protected independently against Search API secondary rate limit
        if yesterday_snap and (not gh_data.get("_prs_ok", True) or gh_prs < yesterday_snap.get("github_prs", 0)):
            snapshot["github_prs"] = yesterday_snap.get("github_prs", 0)
        else:
            snapshot["github_prs"] = gh_prs

        # Issues protected independently against Search API secondary rate limit
        if yesterday_snap and (not gh_data.get("_issues_ok", True) or gh_issues < yesterday_snap.get("github_issues", 0)):
            snapshot["github_issues"] = yesterday_snap.get("github_issues", 0)
        else:
            snapshot["github_issues"] = gh_issues

    if cf_handle and cf_data:
        cf_solved = cf_data.get("codeforces_solved", 0)
        cf_rating = cf_data.get("codeforces_rating", 0)
        cf_max_rating = cf_data.get("codeforces_max_rating", 0)
        cf_rank = cf_data.get("codeforces_rank_title", "Unrated")
        cf_contests = cf_data.get("cf_contests_attended", 0)

        # Solved problems protection
        if yesterday_snap and (not cf_data.get("_status_ok", cf_data.get("_fetch_ok")) or cf_solved < yesterday_snap.get("codeforces_solved", 0)):
            snapshot["codeforces_solved"] = yesterday_snap.get("codeforces_solved", 0)
        else:
            snapshot["codeforces_solved"] = cf_solved

        # Rating & rank protection: do not wipe rating if user.info failed or returned 0 while yesterday had rating
        if yesterday_snap and (not cf_data.get("_info_ok", cf_data.get("_fetch_ok")) or (cf_rating == 0 and yesterday_snap.get("codeforces_rating", 0) > 0)):
            snapshot["codeforces_rating"] = yesterday_snap.get("codeforces_rating", 0)
            snapshot["codeforces_max_rating"] = yesterday_snap.get("codeforces_max_rating", 0)
            snapshot["codeforces_rank_title"] = yesterday_snap.get("codeforces_rank_title", "Unrated")
        else:
            snapshot["codeforces_rating"] = cf_rating
            snapshot["codeforces_max_rating"] = cf_max_rating
            snapshot["codeforces_rank_title"] = cf_rank

        # Contest count protection
        if yesterday_snap and (not cf_data.get("_rating_ok", cf_data.get("_fetch_ok")) or cf_contests < yesterday_snap.get("codeforces_contests", 0)):
            snapshot["codeforces_contests"] = yesterday_snap.get("codeforces_contests", 0)
            _cf_contests = yesterday_snap.get("codeforces_contests", 0)
        else:
            snapshot["codeforces_contests"] = cf_contests
            _cf_contests = cf_contests

    if lc_handle and lc_data:
        lc_total = lc_data.get("leetcode_total", 0)
        if yesterday_snap and (not lc_data.get("_fetch_ok") or lc_total < yesterday_snap.get("leetcode_total", 0)):
            snapshot.update({
                "leetcode_easy": yesterday_snap.get("leetcode_easy", 0),
                "leetcode_medium": yesterday_snap.get("leetcode_medium", 0),
                "leetcode_hard": yesterday_snap.get("leetcode_hard", 0),
                "leetcode_total": yesterday_snap.get("leetcode_total", 0),
                "leetcode_rating": yesterday_snap.get("leetcode_rating", 0),
                "leetcode_max_rating": yesterday_snap.get("leetcode_max_rating", 0),
                "leetcode_contests": yesterday_snap.get("leetcode_contests", 0)
            })
            _lc_contests = yesterday_snap.get("leetcode_contests", 0)
            # Topic stats and badges will reset to empty for this snapshot unless we do a deep merge, 
            # but primary metrics are saved.
        else:
            snapshot.update({
                "leetcode_easy": lc_data.get("leetcode_easy", 0),
                "leetcode_medium": lc_data.get("leetcode_medium", 0),
                "leetcode_hard": lc_data.get("leetcode_hard", 0),
                "leetcode_total": lc_total,
                "leetcode_rating": lc_data.get("leetcode_rating", 0),
                "leetcode_max_rating": lc_data.get("leetcode_max_rating", 0),
                "leetcode_contests": lc_data.get("lc_contests_attended", 0)
            })
            _lc_contests = lc_data.get("lc_contests_attended", 0)
            _lc_badge_name = lc_data.get("lc_badge_name", "")
            _lc_badges_list = lc_data.get("_lc_badges_list", [])
            _lc_summary = lc_data.get("_lc_summary", {})

    if cc_handle and cc_data:
        cc_solved = cc_data.get("codechef_solved", 0)
        if yesterday_snap and (not cc_data.get("_fetch_ok") or cc_solved < yesterday_snap.get("codechef_solved", 0)):
            snapshot.update({
                "codechef_rating": yesterday_snap.get("codechef_rating", 0),
                "codechef_max_rating": yesterday_snap.get("codechef_max_rating", 0),
                "codechef_solved": yesterday_snap.get("codechef_solved", 0),
                "codechef_contests": yesterday_snap.get("codechef_contests", 0)
            })
            _cc_contests = yesterday_snap.get("codechef_contests", 0)
            # No active days delta since fetch failed
        else:
            snapshot.update({
                "codechef_rating": cc_data.get("codechef_rating", 0),
                "codechef_max_rating": cc_data.get("codechef_max_rating", 0),
                "codechef_solved": cc_solved,
                "codechef_contests": cc_data.get("cc_contests_attended", 0)
            })
            _cc_topics = cc_data.get("cc_topics", {})
            _cc_contests = cc_data.get("cc_contests_attended", 0)

    if gfg_handle and gfg_data:
        gfg_solved = gfg_data.get("gfg_solved", 0)
        if yesterday_snap and (not gfg_data.get("_fetch_ok") or gfg_solved < yesterday_snap.get("gfg_solved", 0)):
            snapshot.update({
                "gfg_solved": yesterday_snap.get("gfg_solved", 0),
                "gfg_score": yesterday_snap.get("gfg_score", 0),
                "gfg_school": yesterday_snap.get("gfg_school", 0),
                "gfg_basic": yesterday_snap.get("gfg_basic", 0),
                "gfg_easy": yesterday_snap.get("gfg_easy", 0),
                "gfg_medium": yesterday_snap.get("gfg_medium", 0),
                "gfg_hard": yesterday_snap.get("gfg_hard", 0),
            })
        else:
            snapshot.update({
                "gfg_solved": gfg_solved,
                "gfg_score": gfg_data.get("gfg_score", 0),
                "gfg_school": gfg_data.get("gfg_school", 0),
                "gfg_basic": gfg_data.get("gfg_basic", 0),
                "gfg_easy": gfg_data.get("gfg_easy", 0),
                "gfg_medium": gfg_data.get("gfg_medium", 0),
                "gfg_hard": gfg_data.get("gfg_hard", 0),
            })
            _gfg_topics = gfg_data.get("gfg_topics", {})

    if hr_handle and hr_data:
        hr_badges = hr_data.get("hackerrank_badges", 0)
        if yesterday_snap and (not hr_data.get("_fetch_ok") or hr_badges < yesterday_snap.get("hackerrank_badges", 0)):
            snapshot["hackerrank_badges"] = yesterday_snap.get("hackerrank_badges", 0)
        else:
            snapshot["hackerrank_badges"] = hr_badges
            _hr_badges_list = hr_data.get("hr_badges_list", [])
            _hr_topics = hr_data.get("hr_topics", {})

    snapshot["contests_attended"] = _cf_contests + _lc_contests + _cc_contests
    
    # Merge old topics/badges to prevent resetting if any API failed
    new_topic_stats = build_topic_stats(_lc_summary, _cc_topics, _gfg_topics, _hr_topics)
    new_badges_detail = build_badges_detail(_lc_badges_list, _lc_badge_name, _hr_badges_list)
    
    if yesterday_snap:
        old_topic_stats = yesterday_snap.get("topic_stats") or {}
        old_badges_detail = yesterday_snap.get("badges_detail") or []
        
        # Merge topics: if new is empty but old exists, keep old
        for platform in ["leetcode", "codechef", "gfg", "hackerrank"]:
            if not new_topic_stats.get(platform) and old_topic_stats.get(platform):
                new_topic_stats[platform] = old_topic_stats[platform]
                
        # Merge badges: if new is empty but old exists, keep old
        if not new_badges_detail and old_badges_detail:
            new_badges_detail = old_badges_detail
            
    snapshot["topic_stats"] = new_topic_stats
    snapshot["badges_detail"] = new_badges_detail

    # Anti-spam commit delta calculation
    today_raw = snapshot.get("github_contributions", 0)
    
    if yesterday_snap:
        # Fallback for migration: if raw_github_commits is 0, use old github_contributions
        yesterday_raw = yesterday_snap.get("raw_github_commits") or yesterday_snap.get("github_contributions", 0)
        yesterday_valid = yesterday_snap.get("valid_github_commits") or yesterday_snap.get("github_contributions", 0)
    else:
        # First time user: initialize baseline without capping entire history
        yesterday_raw = today_raw
        yesterday_valid = today_raw

    daily_commits = max(0, today_raw - yesterday_raw)
    capped_daily_commits = min(15, daily_commits)

    snapshot["raw_github_commits"] = today_raw
    snapshot["valid_github_commits"] = yesterday_valid + capped_daily_commits

    days_since_snap = 999
    if yesterday_snap and yesterday_snap.get("snapshot_date"):
        try:
            last_date = datetime.strptime(yesterday_snap["snapshot_date"], "%Y-%m-%d").date()
            days_since_snap = (today_date - last_date).days
        except Exception:
            days_since_snap = 999

    yesterday_total = calculate_total_activity(yesterday_snap) if yesterday_snap else 0
    prev_max_streak = yesterday_snap.get("max_streak", 0) if yesterday_snap else 0
    prev_total = yesterday_total

    if days_since_snap == 1:
        day_before_total = calculate_total_activity(day_before_snap) if day_before_snap else 0
        coded_yesterday = yesterday_total > day_before_total
        base_streak = yesterday_snap.get("current_streak", 0) if coded_yesterday else 0
    elif days_since_snap == 2:
        # Grace window for a single missed sync day: maintain current streak baseline
        base_streak = yesterday_snap.get("current_streak", 0)
    else:
        base_streak = 0

    current_total = calculate_total_activity(snapshot)

    if current_total > prev_total:
        snapshot["current_streak"] = base_streak + 1
    else:
        snapshot["current_streak"] = base_streak

    snapshot["max_streak"] = max(prev_max_streak, snapshot["current_streak"])

    # Active days progression: cumulative count of days where coding activity was recorded
    if yesterday_snap:
        prev_active_days = yesterday_snap.get("active_days", 0)
        if current_total > prev_total:
            snapshot["active_days"] = prev_active_days + 1
        else:
            snapshot["active_days"] = prev_active_days
    else:
        snapshot["active_days"] = 1 if current_total > 0 else 0

    scores = calculate_score(snapshot)
    snapshot["total_score"] = scores["total_score"]
    snapshot["dsa_score"] = scores["dsa_score"]
    snapshot["dev_score"] = scores["dev_score"]
    log.info("  ✓ %s — Total: %.2f (DSA: %.2f | Dev: %.2f)", name, snapshot["total_score"], snapshot["dsa_score"], snapshot["dev_score"])

    snapshot["_is_new_member"] = (len(recent_snapshots) == 0)

    return snapshot


# ---------------------------------------------------------------------------
# Async Main Orchestrator
# ---------------------------------------------------------------------------

async def run_sync() -> None:
    log.info("=" * 60)
    log.info("CODEX Stats Sync Pipeline — %s UTC", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    log.info("Async mode: CHUNK_SIZE=%d, INTER_CHUNK_SLEEP=%ds, TIMEOUT=%ds", CHUNK_SIZE, INTER_CHUNK_SLEEP, REQUEST_TIMEOUT)
    log.info("=" * 60)

    supabase_client = get_supabase_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    first_of_month = datetime.now(timezone.utc).replace(day=1).strftime("%Y-%m-%d")

    log.info("Fetching active members from Supabase...")
    members = get_active_members(supabase_client)
    log.info("Found %d active member(s).", len(members))

    if not members:
        return

    chunks = [members[i : i + CHUNK_SIZE] for i in range(0, len(members), CHUNK_SIZE)]
    total_chunks = len(chunks)
    success_count = fail_count = 0

    connector = aiohttp.TCPConnector(limit=50)
    async with aiohttp.ClientSession(connector=connector) as session:
        for chunk_idx, chunk in enumerate(chunks, start=1):
            log.info("-" * 60 + f"\nChunk {chunk_idx}/{total_chunks} — processing {len(chunk)} member(s)...")

            tasks = [sync_member_async(supabase_client, session, m, today) for m in chunk]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for member, result in zip(chunk, results):
                name = member.get("full_name", member["id"])
                if isinstance(result, Exception):
                    log.error("  ✗ Failed to sync %s: %s", name, result)
                    fail_count += 1
                    continue
                if result.get("_skip_sync"):
                    log.warning("  ⏭ Skipped %s; waiting for a complete initial fetch", name)
                    fail_count += 1
                    continue
                try:
                    is_new = result.pop("_is_new_member", False)
                    upsert_snapshot(supabase_client, result)
                    log.info("  ✓ Upserted snapshot for %s", name)
                    
                    if is_new and today != first_of_month:
                        import copy
                        baseline_copy = copy.deepcopy(result)
                        baseline_copy["snapshot_date"] = first_of_month
                        upsert_snapshot(supabase_client, baseline_copy)
                        log.info("  ✓ Auto-seeded 1st-of-month baseline for new member %s", name)
                        
                    success_count += 1
                except Exception as exc:  # noqa: BLE001
                    log.error("  ✗ Supabase upsert failed for %s: %s", name, exc)
                    fail_count += 1

            if chunk_idx < total_chunks:
                log.info("  ⏳ Sleeping %ds before next chunk...", INTER_CHUNK_SLEEP)
                await asyncio.sleep(INTER_CHUNK_SLEEP)

    log.info("=" * 60)
    log.info("Sync complete. Success: %d | Failed: %d", success_count, fail_count)
    log.info("=" * 60)

    try:
        log.info("Starting rolling GitHub contribution aggregate sync...")
        import sys
        from pathlib import Path
        backfill_script = str(Path(__file__).resolve().parent / "backfill_club_github.py")
        subprocess.run([sys.executable, backfill_script], check=True)
        log.info("GitHub contribution sync finished successfully.")
    except Exception as exc:
        log.error("Failed to run GitHub sync hook: %s", exc)

if __name__ == "__main__":
    asyncio.run(run_sync())
