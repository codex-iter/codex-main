# Krystal-Coded

## Purpose

This update makes the scheduled platform-stat sync more trustworthy under throttling, temporary upstream outages, and manual workflow runs. The design deliberately keeps the existing Supabase schema and scoring model: the changes improve how data is collected and protected, not how members earn points.

## CodeChef: first-party profile data

- **Decision:** remove the dependency on `codechef-stats.tashif.codes`. Its rate limiting had produced intermittent empty/zero results, while the public CodeChef profile exposed the required values.
- **Implementation:** [scripts/fetchers/codechef.py](scripts/fetchers/codechef.py) now makes one request to `https://www.codechef.com/users/{handle}` and extracts current rating, highest rating, total solved problems, and contest count from the returned HTML.
- **Protection:** the fetcher recognizes a real profile page before reporting success, reports failure explicitly when it receives an invalid/challenge page, serializes all CodeChef requests, and leaves a two-second gap before the next request.
- **Documentation:** [api base url.md](api%20base%20url.md) now records the first-party CodeChef URL.

## Rate-limit and retry strategy

- **Codeforces:** [scripts/fetchers/codeforces.py](scripts/fetchers/codeforces.py) uses one shared semaphore and now keeps a two-second gap between all Codeforces API calls. This matches Codeforces' public API guidance and replaces the former one-second interval.
- **CodeChef:** [scripts/fetchers/codechef.py](scripts/fetchers/codechef.py) uses the same serialized approach to reduce Cloudflare throttling risk without adding a proxy service or paid credential.
- **Shared retry behavior:** [scripts/fetchers/utils.py](scripts/fetchers/utils.py) adds `retry_delay()`. A 429 response now waits for the server's numeric or HTTP-date `Retry-After` value when present. If the server supplies no usable value, the client uses exponential backoff plus small random jitter so concurrent retries do not all restart together.
- **Callers updated:** the shared JSON fetcher plus the Codeforces and CodeChef-specific retry paths use the new delay behavior.

## Snapshot integrity

- **Decision:** distinguish a failed fetch from a valid account with zero activity. A zero value must be stored only when it came from a successful platform response.
- **Fetcher status:** [scripts/fetchers/github.py](scripts/fetchers/github.py), [scripts/fetchers/codeforces.py](scripts/fetchers/codeforces.py), [scripts/fetchers/leetcode.py](scripts/fetchers/leetcode.py), [scripts/fetchers/codechef.py](scripts/fetchers/codechef.py), [scripts/fetchers/gfg.py](scripts/fetchers/gfg.py), and [scripts/fetchers/hackerrank.py](scripts/fetchers/hackerrank.py) now return an internal `_fetch_ok` status alongside their existing metrics.
- **Existing members:** [scripts/main.py](scripts/main.py) retains the previous platform values whenever a new platform fetch failed. This avoids erasing ratings, solved counts, contest counts, or GitHub data during a transient outage.
- **New members:** if any configured platform fetch fails during the first sync, [scripts/main.py](scripts/main.py) skips creating that initial snapshot. The member is picked up on the next scheduled run once all linked platforms respond, instead of appearing with inaccurate zero values.

## GitHub Actions protection

- **Decision:** prevent a manually dispatched run and the twice-daily schedule from querying every platform at the same time.
- **Implementation:** [.github/workflows/sync.yml](.github/workflows/sync.yml) now uses the `member-stats-sync` concurrency group with `cancel-in-progress: false`. One sync runs at a time; a manual run waits rather than doubling external request traffic.

## Verification

- **Live CodeChef check:** verified direct profile values for the supplied accounts, including `zesty_wasp_34` at 161 solved problems and a 1255 rating.
- **Live Codeforces check:** verified successful accepted-problem retrieval from a high-volume public profile.
- **Unit tests:** [scripts/tests/test_codechef.py](scripts/tests/test_codechef.py) covers profile parsing and server-directed retry timing. [scripts/tests/test_sync_safety.py](scripts/tests/test_sync_safety.py) covers skipped first snapshots and preservation of an existing CodeChef record after a failed fetch.
- **Validation command:** `python -B -m unittest scripts.tests.test_codechef scripts.tests.test_sync_safety -v`.

## Intentionally not added

- No ScraperAPI/proxy integration: direct CodeChef profile requests worked after pacing was added, so there is no new vendor cost, credential, or data-processing dependency.
- No database migration: `_fetch_ok` is runtime-only and never written to Supabase.
- No scoring changes: the existing leaderboard formula continues to use the same CodeChef, LeetCode, Codeforces, GitHub, GFG, and HackerRank fields.
