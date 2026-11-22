Run python scripts/main.py
2026-10-06 19:20:17 | INFO     | ============================================================
2026-10-06 19:20:17 | INFO     | CODEX Stats Sync Pipeline — 2026-10-06 19:20:17 UTC
2026-10-06 19:20:17 | INFO     | Async mode: CHUNK_SIZE=10, INTER_CHUNK_SLEEP=3s, TIMEOUT=15s
2026-10-06 19:20:17 | INFO     | ============================================================
2026-10-06 19:20:17 | INFO     | Fetching active members from Supabase...
2026-10-06 19:20:18 | INFO     | HTTP Request: GET ***/rest/v1/members?select=%2A&is_active=eq.true "HTTP/2 200 OK"
2026-10-06 19:20:18 | INFO     | Found 23 active member(s).
2026-10-06 19:20:18 | INFO     | ------------------------------------------------------------
Chunk 1/3 — processing 10 member(s)...
2026-10-06 19:20:18 | INFO     |   → Syncing: Rohit Jain (2f93cc16-cd92-49f7-b84d-e8ed3c67a2cd)
2026-10-06 19:20:18 | INFO     |   → Syncing: Amaresh Swain (190d9ced-6e5b-44f5-b4dc-7381a230379e)
2026-10-06 19:20:18 | INFO     |   → Syncing: Koustav Bera (10b44a7b-2c6a-45ff-b916-6775c854906f)
2026-10-06 19:20:18 | INFO     |   → Syncing: Harsh Garg (c70024c3-cf29-4f62-90f0-335c5fb8f74d)
2026-10-06 19:20:18 | INFO     |   → Syncing: Srutirani Sahoo (1d1fa615-4d6a-41af-9a28-95d9b31536c9)
2026-10-06 19:20:18 | INFO     |   → Syncing: P Shreetam Kumar (43d3bcfe-97ce-48e6-af2a-36ea8246ad14)
2026-10-06 19:20:18 | INFO     |   → Syncing: Uddalak Mukhopadhyay (8479a791-124d-4eef-9df8-45eb1793e32a)
2026-10-06 19:20:18 | INFO     |   → Syncing: Mrinall Samal (edb22b42-5b79-4223-a80a-646bfb319e50)
2026-10-06 19:20:18 | INFO     |   → Syncing: Shubham Parida (84ed7109-3f69-41fd-b2ee-c3a88f6ad53e)
2026-10-06 19:20:18 | INFO     |   → Syncing: Pritish Biswas (90a7f8e3-37ca-4ab8-99fb-a5d7266a3e92)
2026-10-06 19:20:20 | INFO     |     ✓ LeetCode     -> easy=81 med=60 hard=7 total=148 contests=5
2026-10-06 19:20:21 | INFO     |     ✓ LeetCode     -> easy=137 med=127 hard=43 total=307 contests=6
2026-10-06 19:20:22 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 1, 'cf_contests_attended': 0}
2026-10-06 19:20:22 | INFO     |     ✓ GFG          -> solved=9 streak=0 [S=0 B=0 E=6 M=3 H=0]
2026-10-06 19:20:22 | INFO     |     ✓ HackerRank   -> badges=10
2026-10-06 19:20:23 | INFO     |     ✓ HackerRank   -> badges=2
2026-10-06 19:20:24 | INFO     |     ✓ GitHub       -> {'github_contributions': 301, 'github_repos': 15, 'github_prs': 4, 'github_issues': 2}
2026-10-06 19:20:24 | INFO     |     ✓ LeetCode     -> easy=154 med=237 hard=64 total=455 contests=3
2026-10-06 19:20:24 | INFO     |     ✓ LeetCode     -> easy=113 med=186 hard=18 total=317 contests=0
2026-10-06 19:20:24 | INFO     |     ✓ HackerRank   -> badges=0
2026-10-06 19:20:24 | INFO     |     ✓ HackerRank   -> badges=1
2026-10-06 19:20:25 | INFO     |     ✓ GFG          -> solved=65 streak=0 [S=0 B=17 E=26 M=21 H=1]
2026-10-06 19:20:25 | WARNING  |     HTTP 404 fetching https://gfg-stats.tashif.codes/P%20Shreetam/stats — Not Found
2026-10-06 19:20:25 | WARNING  |     HTTP 404 fetching https://gfg-stats.tashif.codes/P%20Shreetam/heatmap — Not Found
2026-10-06 19:20:25 | INFO     |     ✓ LeetCode     -> easy=48 med=64 hard=7 total=119 contests=0
2026-10-06 19:20:25 | WARNING  |     HTTP 404 fetching https://gfg-stats.tashif.codes/P%20Shreetam — Not Found
2026-10-06 19:20:26 | INFO     |     ✓ GFG          -> solved=32 streak=0 [S=0 B=0 E=14 M=17 H=1]
2026-10-06 19:20:26 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 1254, 'codeforces_max_rating': 1254, 'codeforces_rank_title': 'pupil', 'codeforces_solved': 227, 'cf_contests_attended': 50}
2026-10-06 19:20:26 | INFO     |     ✓ GFG          -> solved=0 streak=0 [S=0 B=0 E=0 M=0 H=0]
2026-10-06 19:20:26 | INFO     |     ✓ LeetCode     -> easy=118 med=96 hard=18 total=232 contests=0
2026-10-06 19:20:27 | INFO     |     ✓ CodeChef     -> rating=1304 solved=84 streak=0
2026-10-06 19:20:27 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.2f93cc16-cd92-49f7-b84d-e8ed3c67a2cd&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:27 | INFO     |   ✓ Rohit Jain — Total: 285.98 (DSA: 127.28 | Dev: 138.70)
2026-10-06 19:20:27 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/amr7 (Attempt 1/3) — Retrying...
2026-10-06 19:20:27 | INFO     |     ✓ LeetCode     -> easy=56 med=44 hard=7 total=107 contests=0
2026-10-06 19:20:27 | INFO     |     ✓ HackerRank   -> badges=1
2026-10-06 19:20:28 | INFO     |     ✓ GitHub       -> {'github_contributions': 69, 'github_repos': 48, 'github_prs': 1, 'github_issues': 0}
2026-10-06 19:20:29 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/amr7 (Attempt 2/3) — Retrying...
2026-10-06 19:20:29 | INFO     |     ✓ LeetCode     -> easy=94 med=59 hard=8 total=161 contests=0
2026-10-06 19:20:30 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 1288, 'codeforces_max_rating': 1331, 'codeforces_rank_title': 'pupil', 'codeforces_solved': 78, 'cf_contests_attended': 10}
2026-10-06 19:20:30 | INFO     |     ✓ LeetCode     -> easy=21 med=17 hard=3 total=41 contests=4
2026-10-06 19:20:30 | INFO     |     ✓ HackerRank   -> badges=2
2026-10-06 19:20:31 | INFO     |     ✓ GFG          -> solved=95 streak=0 [S=0 B=20 E=27 M=42 H=6]
2026-10-06 19:20:32 | INFO     |     ✓ LeetCode     -> easy=331 med=255 hard=66 total=652 contests=0
2026-10-06 19:20:33 | INFO     |     ✓ GFG          -> solved=112 streak=0 [S=0 B=2 E=27 M=70 H=13]
2026-10-06 19:20:33 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 7, 'cf_contests_attended': 0}
2026-10-06 19:20:33 | INFO     |     ✓ GitHub       -> {'github_contributions': 785, 'github_repos': 39, 'github_prs': 20, 'github_issues': 0}
2026-10-06 19:20:34 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.10b44a7b-2c6a-45ff-b916-6775c854906f&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:34 | INFO     |   ✓ Koustav Bera — Total: 519.07 (DSA: 112.41 | Dev: 382.00)
2026-10-06 19:20:37 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 1, 'cf_contests_attended': 0}
2026-10-06 19:20:38 | INFO     |     ✓ GitHub       -> {'github_contributions': 0, 'github_repos': 0, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:20:40 | INFO     |     ✓ CodeChef     -> rating=1607 solved=280 streak=0
2026-10-06 19:20:41 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.190d9ced-6e5b-44f5-b4dc-7381a230379e&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:41 | INFO     |   ✓ Amaresh Swain — Total: 443.19 (DSA: 319.31 | Dev: 72.55)
2026-10-06 19:20:41 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/gloard (Attempt 1/3) — Retrying...
2026-10-06 19:20:42 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/gloard (Attempt 2/3) — Retrying...
2026-10-06 19:20:43 | INFO     |     ✓ GitHub       -> {'github_contributions': 61, 'github_repos': 5, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:20:48 | INFO     |     ✓ GitHub       -> {'github_contributions': 11, 'github_repos': 6, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:20:49 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.43d3bcfe-97ce-48e6-af2a-36ea8246ad14&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:49 | INFO     |   ✓ P Shreetam Kumar — Total: 46.23 (DSA: 25.70 | Dev: 17.20)
2026-10-06 19:20:49 | INFO     |     ✓ CodeChef     -> rating=1591 solved=86 streak=0
2026-10-06 19:20:50 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.c70024c3-cf29-4f62-90f0-335c5fb8f74d&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:50 | INFO     |   ✓ Harsh Garg — Total: 203.00 (DSA: 178.33 | Dev: 0.00)
2026-10-06 19:20:50 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/sruti_48 (Attempt 1/3) — Retrying...
2026-10-06 19:20:51 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/sruti_48 (Attempt 2/3) — Retrying...
2026-10-06 19:20:53 | INFO     |     ✓ GitHub       -> {'github_contributions': 241, 'github_repos': 62, 'github_prs': 5, 'github_issues': 0}
2026-10-06 19:20:54 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.8479a791-124d-4eef-9df8-45eb1793e32a&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:54 | INFO     |   ✓ Uddalak Mukhopadhyay — Total: 202.70 (DSA: 28.08 | Dev: 141.95)
2026-10-06 19:20:58 | INFO     |     ✓ GitHub       -> {'github_contributions': 1266, 'github_repos': 52, 'github_prs': 209, 'github_issues': 1}
2026-10-06 19:20:59 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.edb22b42-5b79-4223-a80a-646bfb319e50&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:20:59 | INFO     |   ✓ Mrinall Samal — Total: 513.43 (DSA: 75.43 | Dev: 428.00)
2026-10-06 19:21:03 | INFO     |     ✓ CodeChef     -> rating=1072 solved=98 streak=0
2026-10-06 19:21:04 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.1d1fa615-4d6a-41af-9a28-95d9b31536c9&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:04 | INFO     |   ✓ Srutirani Sahoo — Total: 80.80 (DSA: 37.43 | Dev: 24.70)
2026-10-06 19:21:04 | INFO     |     ✓ GitHub       -> {'github_contributions': 261, 'github_repos': 50, 'github_prs': 16, 'github_issues': 0}
2026-10-06 19:21:04 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.84ed7109-3f69-41fd-b2ee-c3a88f6ad53e&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:04 | INFO     |   ✓ Shubham Parida — Total: 261.48 (DSA: 15.95 | Dev: 242.20)
2026-10-06 19:21:09 | INFO     |     ✓ CodeChef     -> rating=896 solved=7 streak=0
2026-10-06 19:21:09 | INFO     |     ✓ GitHub       -> {'github_contributions': 32, 'github_repos': 64, 'github_prs': 41, 'github_issues': 10}
2026-10-06 19:21:10 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.90a7f8e3-37ca-4ab8-99fb-a5d7266a3e92&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:10 | INFO     |   ✓ Pritish Biswas — Total: 377.27 (DSA: 41.20 | Dev: 261.40)
2026-10-06 19:21:11 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:11 | INFO     |   ✓ Upserted snapshot for Rohit Jain
2026-10-06 19:21:11 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:11 | INFO     |   ✓ Upserted snapshot for Amaresh Swain
2026-10-06 19:21:12 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:12 | INFO     |   ✓ Upserted snapshot for Koustav Bera
2026-10-06 19:21:12 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:12 | INFO     |   ✓ Upserted snapshot for Harsh Garg
2026-10-06 19:21:13 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:13 | INFO     |   ✓ Upserted snapshot for Srutirani Sahoo
2026-10-06 19:21:13 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:13 | INFO     |   ✓ Upserted snapshot for P Shreetam Kumar
2026-10-06 19:21:14 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:14 | INFO     |   ✓ Upserted snapshot for Uddalak Mukhopadhyay
2026-10-06 19:21:15 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:15 | INFO     |   ✓ Upserted snapshot for Mrinall Samal
2026-10-06 19:21:15 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:15 | INFO     |   ✓ Upserted snapshot for Shubham Parida
2026-10-06 19:21:15 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:21:15 | INFO     |   ✓ Upserted snapshot for Pritish Biswas
2026-10-06 19:21:15 | INFO     |   ⏳ Sleeping 3s before next chunk...
2026-10-06 19:21:18 | INFO     | ------------------------------------------------------------
Chunk 2/3 — processing 10 member(s)...
2026-10-06 19:21:18 | INFO     |   → Syncing: Aditya Sekhar Das (61ecb8a1-a86d-47cc-a3fa-73a62e47a065)
2026-10-06 19:21:18 | INFO     |   → Syncing: Khushi Choudhary (90569ba3-e796-4a3e-8517-047987425227)
2026-10-06 19:21:18 | INFO     |   → Syncing: Puja Sharma (cda002d2-d57e-451b-bd50-f901e5fa6147)
2026-10-06 19:21:18 | INFO     |   → Syncing: Abhishek Raj (e768ca15-0b3d-4792-a3e9-7a9145055dd8)
2026-10-06 19:21:18 | INFO     |   → Syncing: Swadhin Dibya Jyoti (0466fafd-6705-45cc-9256-dc7c836e8fa9)
2026-10-06 19:21:18 | INFO     |   → Syncing: Krish Raj (d0ad9a1f-fd65-44b3-9c54-b8ff7d607eff)
2026-10-06 19:21:18 | INFO     |   → Syncing: Nandini Burnwal (1ca9e9ee-d09f-4efb-86e0-49b3dd7d4308)
2026-10-06 19:21:18 | INFO     |   → Syncing: Tushar Kumar (4a91ad34-4ff5-4465-9e71-378a56501e52)
2026-10-06 19:21:18 | INFO     |   → Syncing: Vanshika Jhunjhunwala (9d01e97f-78cb-4603-92cd-222e9fe123bf)
2026-10-06 19:21:18 | INFO     |   → Syncing: Satyanarayan Mohanty (3a15a04f-00ff-439f-a265-0779e4fcb2a3)
2026-10-06 19:21:19 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9 (Attempt 1/3) — Retrying...
2026-10-06 19:21:20 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9 (Attempt 2/3) — Retrying...
2026-10-06 19:21:20 | INFO     |     ✓ LeetCode     -> easy=162 med=139 hard=14 total=315 contests=29
2026-10-06 19:21:20 | INFO     |     ✓ HackerRank   -> badges=1
2026-10-06 19:21:21 | INFO     |     ✓ HackerRank   -> badges=1
2026-10-06 19:21:21 | INFO     |     ✓ GFG          -> solved=8 streak=0 [S=0 B=5 E=2 M=1 H=0]
2026-10-06 19:21:21 | INFO     |     ✓ LeetCode     -> easy=239 med=55 hard=4 total=298 contests=2
2026-10-06 19:21:22 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9 (Attempt 3/3) — Retrying...
2026-10-06 19:21:22 | INFO     |     ✓ LeetCode     -> easy=49 med=28 hard=0 total=77 contests=0
2026-10-06 19:21:22 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 752, 'codeforces_max_rating': 752, 'codeforces_rank_title': 'newbie', 'codeforces_solved': 9, 'cf_contests_attended': 3}
2026-10-06 19:21:22 | INFO     |     ✓ HackerRank   -> badges=2
2026-10-06 19:21:23 | INFO     |     ✓ LeetCode     -> easy=196 med=63 hard=6 total=265 contests=7
2026-10-06 19:21:23 | INFO     |     ✓ HackerRank   -> badges=0
2026-10-06 19:21:23 | INFO     |     ✓ HackerRank   -> badges=4
2026-10-06 19:21:24 | INFO     |     ✓ GFG          -> solved=19 streak=0 [S=0 B=3 E=6 M=10 H=0]
2026-10-06 19:21:24 | INFO     |     ✓ GitHub       -> {'github_contributions': 386, 'github_repos': 19, 'github_prs': 8, 'github_issues': 0}
2026-10-06 19:21:24 | INFO     |     ✓ GFG          -> solved=93 streak=0 [S=0 B=28 E=33 M=32 H=0]
2026-10-06 19:21:24 | INFO     |     ✓ LeetCode     -> easy=5 med=0 hard=0 total=5 contests=0
2026-10-06 19:21:25 | INFO     |     ✓ HackerRank   -> badges=0
2026-10-06 19:21:25 | INFO     |     ✓ LeetCode     -> easy=61 med=71 hard=12 total=144 contests=0
2026-10-06 19:21:26 | INFO     |     ✓ GFG          -> solved=6 streak=0 [S=0 B=1 E=2 M=3 H=0]
2026-10-06 19:21:26 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 597, 'codeforces_max_rating': 597, 'codeforces_rank_title': 'newbie', 'codeforces_solved': 5, 'cf_contests_attended': 2}
2026-10-06 19:21:26 | INFO     |     ✓ LeetCode     -> easy=56 med=83 hard=13 total=152 contests=0
2026-10-06 19:21:26 | INFO     |     ✓ HackerRank   -> badges=2
2026-10-06 19:21:26 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9/heatmap (Attempt 1/3) — Retrying...
2026-10-06 19:21:27 | INFO     |     ✓ LeetCode     -> easy=262 med=525 hard=63 total=850 contests=8
2026-10-06 19:21:27 | INFO     |     ✓ HackerRank   -> badges=1
2026-10-06 19:21:27 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9/heatmap (Attempt 2/3) — Retrying...
2026-10-06 19:21:29 | INFO     |     ✓ GitHub       -> {'github_contributions': 49, 'github_repos': 27, 'github_prs': 6, 'github_issues': 6}
2026-10-06 19:21:29 | INFO     |     ✓ LeetCode     -> easy=243 med=426 hard=155 total=824 contests=1
2026-10-06 19:21:29 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 1, 'cf_contests_attended': 0}
2026-10-06 19:21:30 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9/heatmap (Attempt 3/3) — Retrying...
2026-10-06 19:21:31 | INFO     |     ✓ LeetCode     -> easy=276 med=476 hard=123 total=875 contests=35
2026-10-06 19:21:32 | INFO     |     ✓ GFG          -> solved=151 streak=1 [S=0 B=11 E=45 M=82 H=13]
2026-10-06 19:21:33 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 598, 'codeforces_max_rating': 598, 'codeforces_rank_title': 'newbie', 'codeforces_solved': 10, 'cf_contests_attended': 2}
2026-10-06 19:21:34 | INFO     |     ✓ GitHub       -> {'github_contributions': 48, 'github_repos': 9, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:21:34 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9/contests (Attempt 1/3) — Retrying...
2026-10-06 19:21:35 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9/contests (Attempt 2/3) — Retrying...
2026-10-06 19:21:36 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 1, 'cf_contests_attended': 0}
2026-10-06 19:21:37 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/adityasdas9/contests (Attempt 3/3) — Retrying...
2026-10-06 19:21:39 | INFO     |     ✓ GitHub       -> {'github_contributions': 189, 'github_repos': 36, 'github_prs': 12, 'github_issues': 5}
2026-10-06 19:21:40 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 0, 'cf_contests_attended': 0}
2026-10-06 19:21:43 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 0, 'cf_contests_attended': 0}
2026-10-06 19:21:44 | INFO     |     ✓ GitHub       -> {'github_contributions': 324, 'github_repos': 17, 'github_prs': 19, 'github_issues': 0}
2026-10-06 19:21:48 | INFO     |     ✓ CodeChef     -> rating=0 solved=0 streak=0
2026-10-06 19:21:48 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.61ecb8a1-a86d-47cc-a3fa-73a62e47a065&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:48 | INFO     |   ✓ Aditya Sekhar Das — Total: 509.66 (DSA: 179.62 | Dev: 194.70)
2026-10-06 19:21:49 | INFO     |     ✓ GitHub       -> {'github_contributions': 11, 'github_repos': 6, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:21:49 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.d0ad9a1f-fd65-44b3-9c54-b8ff7d607eff&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:49 | INFO     |   ✓ Krish Raj — Total: 20.78 (DSA: 0.25 | Dev: 17.20)
2026-10-06 19:21:54 | INFO     |     ✓ GitHub       -> {'github_contributions': 13, 'github_repos': 11, 'github_prs': 2, 'github_issues': 1}
2026-10-06 19:21:54 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.1ca9e9ee-d09f-4efb-86e0-49b3dd7d4308&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:54 | INFO     |   ✓ Nandini Burnwal — Total: 135.42 (DSA: 44.15 | Dev: 50.60)
2026-10-06 19:21:54 | INFO     |     ✓ CodeChef     -> rating=0 solved=111 streak=0
2026-10-06 19:21:55 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.90569ba3-e796-4a3e-8517-047987425227&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:55 | INFO     |   ✓ Khushi Choudhary — Total: 198.08 (DSA: 58.44 | Dev: 130.30)
2026-10-06 19:21:59 | INFO     |     ✓ GitHub       -> {'github_contributions': 46, 'github_repos': 66, 'github_prs': 10, 'github_issues': 11}
2026-10-06 19:21:59 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.4a91ad34-4ff5-4465-9e71-378a56501e52&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:21:59 | INFO     |   ✓ Tushar Kumar — Total: 305.41 (DSA: 122.38 | Dev: 179.70)
2026-10-06 19:22:00 | INFO     |     ✓ CodeChef     -> rating=0 solved=75 streak=0
2026-10-06 19:22:00 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.cda002d2-d57e-451b-bd50-f901e5fa6147&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:00 | INFO     |   ✓ Puja Sharma — Total: 68.24 (DSA: 20.81 | Dev: 32.10)
2026-10-06 19:22:04 | INFO     |     ✓ CodeChef     -> rating=0 solved=35 streak=0
2026-10-06 19:22:05 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.e768ca15-0b3d-4792-a3e9-7a9145055dd8&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:05 | INFO     |   ✓ Abhishek Raj — Total: 296.35 (DSA: 60.55 | Dev: 207.80)
2026-10-06 19:22:05 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/zesty_wasp_34 (Attempt 1/3) — Retrying...
2026-10-06 19:22:05 | INFO     |     ✓ GitHub       -> {'github_contributions': 16, 'github_repos': 6, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:22:05 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.9d01e97f-78cb-4603-92cd-222e9fe123bf&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:05 | INFO     |   ✓ Vanshika Jhunjhunwala — Total: 233.70 (DSA: 212.17 | Dev: 18.20)
2026-10-06 19:22:10 | INFO     |     ✓ GitHub       -> {'github_contributions': 117, 'github_repos': 38, 'github_prs': 29, 'github_issues': 3}
2026-10-06 19:22:11 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.3a15a04f-00ff-439f-a265-0779e4fcb2a3&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:11 | INFO     |   ✓ Satyanarayan Mohanty — Total: 357.61 (DSA: 96.88 | Dev: 257.40)
2026-10-06 19:22:13 | INFO     |     ✓ CodeChef     -> rating=1255 solved=161 streak=0
2026-10-06 19:22:14 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.0466fafd-6705-45cc-9256-dc7c836e8fa9&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:14 | INFO     |   ✓ Swadhin Dibya Jyoti — Total: 403.30 (DSA: 81.75 | Dev: 273.55)
2026-10-06 19:22:14 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:14 | INFO     |   ✓ Upserted snapshot for Aditya Sekhar Das
2026-10-06 19:22:15 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:15 | INFO     |   ✓ Upserted snapshot for Khushi Choudhary
2026-10-06 19:22:15 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:15 | INFO     |   ✓ Upserted snapshot for Puja Sharma
2026-10-06 19:22:16 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:16 | INFO     |   ✓ Upserted snapshot for Abhishek Raj
2026-10-06 19:22:16 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:16 | INFO     |   ✓ Upserted snapshot for Swadhin Dibya Jyoti
2026-10-06 19:22:17 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 201 Created"
2026-10-06 19:22:17 | INFO     |   ✓ Upserted snapshot for Krish Raj
2026-10-06 19:22:17 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 201 Created"
2026-10-06 19:22:17 | INFO     |   ✓ Upserted snapshot for Nandini Burnwal
2026-10-06 19:22:17 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 201 Created"
2026-10-06 19:22:17 | INFO     |   ✓ Upserted snapshot for Tushar Kumar
2026-10-06 19:22:18 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 201 Created"
2026-10-06 19:22:18 | INFO     |   ✓ Upserted snapshot for Vanshika Jhunjhunwala
2026-10-06 19:22:18 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 201 Created"
2026-10-06 19:22:18 | INFO     |   ✓ Upserted snapshot for Satyanarayan Mohanty
2026-10-06 19:22:18 | INFO     |   ⏳ Sleeping 3s before next chunk...
2026-10-06 19:22:21 | INFO     | ------------------------------------------------------------
Chunk 3/3 — processing 3 member(s)...
2026-10-06 19:22:21 | INFO     |   → Syncing: Sumana Shyam (592433ba-31d4-409c-83d2-67b80ae0cef6)
2026-10-06 19:22:21 | INFO     |   → Syncing: Srideep Kundu (3a8cf1f6-bbe9-4ae7-b97a-90b24a4a05cf)
2026-10-06 19:22:21 | INFO     |   → Syncing: Divyanshu Kumar (ce8d0077-7276-42af-a1b2-e8ad9e8a71b5)
2026-10-06 19:22:22 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/sumana9434 (Attempt 1/3) — Retrying...
2026-10-06 19:22:22 | WARNING  |     HTTP 404 fetching https://gfg-stats.tashif.codes/Sumana%20Shyam — Not Found
2026-10-06 19:22:22 | WARNING  |     HTTP 404 fetching https://gfg-stats.tashif.codes/Sumana%20Shyam/heatmap — Not Found
2026-10-06 19:22:22 | WARNING  |     HTTP 404 fetching https://gfg-stats.tashif.codes/Sumana%20Shyam/stats — Not Found
2026-10-06 19:22:23 | INFO     |     ✓ LeetCode     -> easy=0 med=0 hard=0 total=0 contests=0
2026-10-06 19:22:23 | INFO     |     ✓ GFG          -> solved=0 streak=0 [S=0 B=0 E=0 M=0 H=0]
2026-10-06 19:22:23 | INFO     |     ✓ LeetCode     -> easy=81 med=71 hard=4 total=156 contests=0
2026-10-06 19:22:23 | INFO     |     ✓ HackerRank   -> badges=3
2026-10-06 19:22:24 | INFO     |     ✓ LeetCode     -> easy=83 med=86 hard=14 total=183 contests=0
2026-10-06 19:22:25 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 1023, 'codeforces_max_rating': 1023, 'codeforces_rank_title': 'newbie', 'codeforces_solved': 81, 'cf_contests_attended': 4}
2026-10-06 19:22:25 | INFO     |     ✓ GFG          -> solved=68 streak=0 [S=0 B=19 E=29 M=20 H=0]
2026-10-06 19:22:25 | INFO     |     ✓ HackerRank   -> badges=4
2026-10-06 19:22:26 | INFO     |     ✓ GFG          -> solved=35 streak=0 [S=0 B=13 E=10 M=10 H=2]
2026-10-06 19:22:26 | INFO     |     ✓ GitHub       -> {'github_contributions': 2, 'github_repos': 3, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:22:27 | INFO     |     ✓ CodeChef     -> rating=0 solved=0 streak=0
2026-10-06 19:22:27 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.592433ba-31d4-409c-83d2-67b80ae0cef6&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:27 | INFO     |   ✓ Sumana Shyam — Total: 11.23 (DSA: 0.00 | Dev: 7.90)
2026-10-06 19:22:27 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/angel_rain_58 (Attempt 1/3) — Retrying...
2026-10-06 19:22:29 | INFO     |     ✓ Codeforces   -> {'codeforces_rating': 0, 'codeforces_max_rating': 0, 'codeforces_rank_title': 'Unrated', 'codeforces_solved': 0, 'cf_contests_attended': 0}
2026-10-06 19:22:32 | INFO     |     ✓ GitHub       -> {'github_contributions': 37, 'github_repos': 21, 'github_prs': 2, 'github_issues': 1}
2026-10-06 19:22:33 | INFO     |     ✓ CodeChef     -> rating=1451 solved=99 streak=0
2026-10-06 19:22:33 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.3a8cf1f6-bbe9-4ae7-b97a-90b24a4a05cf&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:33 | INFO     |   ✓ Srideep Kundu — Total: 278.90 (DSA: 148.73 | Dev: 73.50)
2026-10-06 19:22:33 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/divyanshu1903 (Attempt 1/3) — Retrying...
2026-10-06 19:22:34 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/divyanshu1903 (Attempt 2/3) — Retrying...
2026-10-06 19:22:36 | INFO     |     ✓ GitHub       -> {'github_contributions': 113, 'github_repos': 10, 'github_prs': 0, 'github_issues': 0}
2026-10-06 19:22:37 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/divyanshu1903 (Attempt 3/3) — Retrying...
2026-10-06 19:22:41 | WARNING  |     HTTP 429 fetching https://codechef-stats.tashif.codes/divyanshu1903/heatmap (Attempt 1/3) — Retrying...
2026-10-06 19:22:46 | INFO     |     ✓ CodeChef     -> rating=0 solved=0 streak=0
2026-10-06 19:22:46 | INFO     | HTTP Request: GET ***/rest/v1/activity_snapshots?select=%2A&member_id=eq.ce8d0077-7276-42af-a1b2-e8ad9e8a71b5&snapshot_date=lt.2026-10-06&order=snapshot_date.desc&limit=2 "HTTP/2 200 OK"
2026-10-06 19:22:46 | INFO     |   ✓ Divyanshu Kumar — Total: 83.97 (DSA: 27.38 | Dev: 36.60)
2026-10-06 19:22:47 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 201 Created"
2026-10-06 19:22:47 | INFO     |   ✓ Upserted snapshot for Sumana Shyam
2026-10-06 19:22:48 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:48 | INFO     |   ✓ Upserted snapshot for Srideep Kundu
2026-10-06 19:22:48 | INFO     | HTTP Request: POST ***/rest/v1/activity_snapshots?on_conflict=member_id%2Csnapshot_date "HTTP/2 200 OK"
2026-10-06 19:22:48 | INFO     |   ✓ Upserted snapshot for Divyanshu Kumar
2026-10-06 19:22:48 | INFO     | ============================================================
2026-10-06 19:22:48 | INFO     | Sync complete. Success: 23 | Failed: 0
2026-10-06 19:22:48 | INFO     | ============================================================
2026-10-06 19:22:48 | INFO     | Starting rolling GitHub contribution aggregate sync...
Found 23 active members with GitHub handles.
Successfully upserted 365 rows into club_github_history.
2026-10-06 19:23:10 | INFO     | GitHub contribution sync finished successfully.