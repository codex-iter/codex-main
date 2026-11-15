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
