import os
import re
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone

# Load environment variables from available env paths
current_dir = os.path.dirname(os.path.abspath(__file__))
for env_name in [".env.local", ".env"]:
    p = os.path.join(current_dir, "..", "frontend", env_name)
    if os.path.exists(p):
        load_dotenv(p)
load_dotenv(os.path.join(current_dir, "..", ".env"))
load_dotenv()

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials missing in env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_github_native_contributions(handle):
    url = f"https://github.com/users/{handle}/contributions"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }
    date_counts = {}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            print(f"Failed native fetch for {handle}: {res.status_code}")
            return {}
        
        html = res.text
        td_pattern = re.compile(r'<td[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>')
        tds = td_pattern.findall(html)
        
        for td in tds:
            id_match = re.search(r'id="([^"]+)"', td)
            date_match = re.search(r'data-date="([^"]+)"', td)
            if id_match and date_match:
                id_val = id_match.group(1)
                c_date = date_match.group(1)
                tt_pattern = re.compile(r'<tool-tip[^>]*for="' + re.escape(id_val) + r'"[^>]*>(.*?)</tool-tip>', re.IGNORECASE | re.DOTALL)
                tt_match = tt_pattern.search(html)
                if tt_match:
                    tt_text = tt_match.group(1).strip()
                    if tt_text.lower().startswith("no"):
                        count = 0
                    else:
                        m = re.match(r"^(\d+)", tt_text)
                        count = int(m.group(1)) if m else 0
                    date_counts[c_date] = count
    except Exception as e:
        print(f"Error fetching native github for {handle}: {e}")
        
    return date_counts

def backfill():
    # 1. Fetch active members with github handles with pagination
    members = []
    page_size = 1000
    start = 0
    while True:
        res = supabase.table("members").select("github_handle").eq("is_active", True).range(start, start + page_size - 1).execute()
        batch = res.data or []
        members.extend(batch)
        if len(batch) < page_size:
            break
        start += page_size
    
    handles = [m["github_handle"] for m in members if m.get("github_handle")]
    print(f"Found {len(handles)} active members with GitHub handles.")
    
    # 2. Setup dictionary to aggregate counts
    # Pre-fill last 365 days with 0
    today = datetime.now(timezone.utc).date()
    date_map = {}
    for i in range(365):
        d = today - timedelta(days=i)
        date_map[d.isoformat()] = 0
        
    # 3. Fetch natively from Github
    for handle in handles:
        counts = fetch_github_native_contributions(handle)
        for c_date, c_count in counts.items():
            if c_date in date_map:
                date_map[c_date] += c_count
            
    # 4. Prepare bulk upsert
    upsert_data = [{"date": d, "commits": c} for d, c in date_map.items()]
    
    # 5. Push to Supabase
    try:
        res = supabase.table("club_github_history").upsert(upsert_data).execute()
        print(f"Successfully upserted {len(upsert_data)} rows into club_github_history.")
    except Exception as e:
        print(f"Error inserting into Supabase: {e}")

if __name__ == "__main__":
    backfill()
