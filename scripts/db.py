import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize and return a Supabase client using environment variables."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
        )
    return create_client(url, key)

def get_active_members(client: Client) -> list:
    """Fetch all active members from Supabase with range pagination."""
    all_members = []
    page_size = 1000
    start = 0
    while True:
        response = client.table("members").select("*").eq("is_active", True).range(start, start + page_size - 1).execute()
        data = response.data or []
        all_members.extend(data)
        if len(data) < page_size:
            break
        start += page_size
    return all_members

def upsert_snapshot(client: Client, snapshot: dict) -> None:
    """Upsert a single activity snapshot to Supabase."""
    client.table("activity_snapshots").upsert(
        snapshot,
        on_conflict="member_id,snapshot_date",
    ).execute()

def get_recent_snapshots(client: Client, member_id: str, today: str, limit: int = 2) -> list:
    """Fetch the most recent snapshots before today for global streak calculation."""
    res = client.table("activity_snapshots").select("*") \
        .eq("member_id", member_id) \
        .lt("snapshot_date", today) \
        .order("snapshot_date", desc=True) \
        .limit(limit).execute()
    return res.data or []
