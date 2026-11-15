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
