import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

sys.modules.setdefault("supabase", types.SimpleNamespace(Client=object, create_client=lambda *_: None))
sys.modules.setdefault("dotenv", types.SimpleNamespace(load_dotenv=lambda: None))

import db
import main


FAILED_CODECHEF = {
    "codechef_rating": 0,
    "codechef_max_rating": 0,
    "codechef_solved": 0,
    "cc_contests_attended": 0,
    "_fetch_ok": False,
}


class SnapshotSafetyTests(unittest.IsolatedAsyncioTestCase):
    async def test_skips_a_new_member_when_a_linked_platform_fails(self):
        member = {"id": "member-1", "full_name": "New Member", "codechef_handle": "unreachable"}

        with patch.object(main, "fetch_codechef", new=AsyncMock(return_value=FAILED_CODECHEF)), patch.object(db, "get_recent_snapshots", return_value=[]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        self.assertEqual(result, {"_skip_sync": True})

    async def test_preserves_an_existing_platform_record_when_fetch_fails(self):
        previous = {
            "snapshot_date": "2026-11-14",
            "codechef_rating": 1255,
            "codechef_max_rating": 1255,
            "codechef_solved": 161,
            "codechef_contests": 7,
        }
        member = {"id": "member-1", "full_name": "Existing Member", "codechef_handle": "zesty_wasp_34"}

        with patch.object(main, "fetch_codechef", new=AsyncMock(return_value=FAILED_CODECHEF)), patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        self.assertEqual(result["codechef_rating"], 1255)
        self.assertEqual(result["codechef_max_rating"], 1255)
        self.assertEqual(result["codechef_solved"], 161)
        self.assertEqual(result["codechef_contests"], 7)

    async def test_preserves_codeforces_rating_when_user_info_fails_but_status_succeeds(self):
        previous = {
            "snapshot_date": "2026-11-14",
            "codeforces_rating": 1850,
            "codeforces_max_rating": 1850,
            "codeforces_rank_title": "Candidate Master",
            "codeforces_solved": 150,
            "codeforces_contests": 25,
        }
        member = {"id": "member-cf", "full_name": "CF Master", "codeforces_handle": "tourist"}
        # user.status succeeded (solved 152), but user.info timed out (rating 0)
        cf_partial = {
            "codeforces_rating": 0,
            "codeforces_max_rating": 0,
            "codeforces_rank_title": "Unrated",
            "codeforces_solved": 152,
            "cf_contests_attended": 25,
            "_info_ok": False,
            "_status_ok": True,
            "_rating_ok": True,
            "_fetch_ok": True,
        }
        with patch.object(main, "fetch_codeforces", new=AsyncMock(return_value=cf_partial)), patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        self.assertEqual(result["codeforces_rating"], 1850)
        self.assertEqual(result["codeforces_max_rating"], 1850)
        self.assertEqual(result["codeforces_rank_title"], "Candidate Master")
        self.assertEqual(result["codeforces_solved"], 152)

    async def test_preserves_github_prs_and_issues_when_search_api_rate_limits(self):
        previous = {
            "snapshot_date": "2026-11-14",
            "raw_github_commits": 100,
            "valid_github_commits": 100,
            "github_contributions": 100,
            "github_repos": 15,
            "github_prs": 30,
            "github_issues": 12,
        }
        member = {"id": "member-gh", "full_name": "GH Dev", "github_handle": "octocat"}
        # GraphQL succeeded (commits 105), but Search API 403 throttled PRs and issues to 0
        gh_partial = {
            "github_contributions": 105,
            "github_repos": 15,
            "github_prs": 0,
            "github_issues": 0,
            "_gql_ok": True,
            "_prs_ok": False,
            "_issues_ok": False,
            "_fetch_ok": True,
        }
        with patch.object(main, "fetch_github", new=AsyncMock(return_value=gh_partial)), patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        self.assertEqual(result["github_contributions"], 105)
        self.assertEqual(result["github_prs"], 30)
        self.assertEqual(result["github_issues"], 12)

    async def test_increments_active_days_when_activity_detected(self):
        previous = {
            "snapshot_date": "2026-11-14",
            "active_days": 14,
            "raw_github_commits": 10,
            "valid_github_commits": 10,
            "github_contributions": 10,
        }
        member = {"id": "member-act", "full_name": "Active Coder", "github_handle": "coder"}
        gh_new = {
            "github_contributions": 12,
            "github_repos": 1,
            "github_prs": 0,
            "github_issues": 0,
            "_gql_ok": True,
            "_prs_ok": True,
            "_issues_ok": True,
            "_fetch_ok": True,
        }
        with patch.object(main, "fetch_github", new=AsyncMock(return_value=gh_new)), patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        self.assertEqual(result["active_days"], 15)

    async def test_streak_grace_window_across_missed_day(self):
        previous = {
            "snapshot_date": "2026-11-13",  # 2 days ago (missed sync on 2026-11-14)
            "active_days": 20,
            "current_streak": 5,
            "max_streak": 5,
            "raw_github_commits": 10,
            "valid_github_commits": 10,
            "github_contributions": 10,
        }
        member = {"id": "member-str", "full_name": "Streak Hero", "github_handle": "hero"}
        gh_new = {
            "github_contributions": 15,
            "github_repos": 1,
            "github_prs": 0,
            "github_issues": 0,
            "_gql_ok": True,
            "_prs_ok": True,
            "_issues_ok": True,
            "_fetch_ok": True,
        }
        with patch.object(main, "fetch_github", new=AsyncMock(return_value=gh_new)), patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        # Streak should increment from 5 to 6 instead of collapsing to 1
        self.assertEqual(result["current_streak"], 6)
        self.assertEqual(result["max_streak"], 6)

    async def test_preserves_leetcode_contest_metrics_when_contest_endpoint_fails(self):
        previous = {
            "snapshot_date": "2026-11-14",
            "leetcode_total": 200,
            "leetcode_easy": 100,
            "leetcode_medium": 80,
            "leetcode_hard": 20,
            "leetcode_rating": 1850,
            "leetcode_max_rating": 1900,
            "leetcode_contests": 15,
        }
        member = {"id": "member-lc", "full_name": "LC Knight", "leetcode_handle": "knight123"}
        lc_partial = {
            "leetcode_total": 201,
            "leetcode_easy": 100,
            "leetcode_medium": 81,
            "leetcode_hard": 20,
            "leetcode_rating": 0,
            "leetcode_max_rating": 0,
            "lc_contests_attended": 0,
            "_summary_ok": True,
            "_contest_ok": False,
            "_badges_ok": True,
            "_fetch_ok": True,
        }
        with patch.object(main, "fetch_leetcode", new=AsyncMock(return_value=lc_partial)), patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        self.assertEqual(result["leetcode_total"], 201)
        self.assertEqual(result["leetcode_rating"], 1850)
        self.assertEqual(result["leetcode_max_rating"], 1900)
        self.assertEqual(result["leetcode_contests"], 15)

    async def test_streak_persists_when_rolling_github_contributions_drop(self):
        # 1-year rolling calendar dropped past contributions from 500 to 495, but member solved 1 new question
        previous = {
            "snapshot_date": "2026-11-14",
            "current_streak": 10,
            "max_streak": 10,
            "valid_github_commits": 50,
            "raw_github_commits": 500,
            "github_contributions": 500,
            "leetcode_total": 100,
        }
        member = {"id": "member-rolling", "full_name": "Rolling Hero", "leetcode_handle": "hero"}
        lc_data = {
            "leetcode_total": 101,  # Solved 1 problem today
            "leetcode_easy": 101,
            "leetcode_medium": 0,
            "leetcode_hard": 0,
            "_summary_ok": True,
            "_contest_ok": True,
            "_badges_ok": True,
            "_fetch_ok": True,
        }
        # GitHub contributions rolled off from 500 to 495
        gh_data = {
            "github_contributions": 495,
            "github_repos": 5,
            "github_prs": 0,
            "github_issues": 0,
            "_gql_ok": True,
            "_prs_ok": True,
            "_issues_ok": True,
            "_fetch_ok": True,
        }
        with patch.object(main, "fetch_leetcode", new=AsyncMock(return_value=lc_data)), \
             patch.object(main, "fetch_github", new=AsyncMock(return_value=gh_data)), \
             patch.object(db, "get_recent_snapshots", return_value=[previous]):
            result = await main.sync_member_async(object(), object(), member, "2026-11-15")

        # Streak should increment from 10 to 11 because valid_github_commits + leetcode_total advanced
        self.assertEqual(result["current_streak"], 11)

    def test_clean_handle_normalizes_urls_and_symbols(self):
        from fetchers import clean_handle
        self.assertEqual(clean_handle("https://leetcode.com/u/john_doe/"), "john_doe")
        self.assertEqual(clean_handle("https://github.com/octocat/"), "octocat")
        self.assertEqual(clean_handle("  @tourist  "), "tourist")
        self.assertEqual(clean_handle("https://codeforces.com/profile/petr"), "petr")
        self.assertEqual(clean_handle("https://www.codechef.com/users/chef_123"), "chef_123")
        self.assertEqual(clean_handle(""), "")
        self.assertEqual(clean_handle(None), "")
