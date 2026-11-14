# Krystal-Coded

## CodeChef data source

- Replaced the rate-limited `codechef-stats.tashif.codes` dependency with CodeChef's public profile page.
- Extracts current rating, highest rating, total solved problems, and contest count from the first-party profile HTML.
- Added a parser test and updated the documented CodeChef base URL.

## Reliable platform syncing

- Codeforces requests are globally serialized and spaced two seconds apart, matching its public API limit.
- CodeChef profile requests are globally serialized with a two-second interval to reduce Cloudflare throttling.
- All 429 retry paths now honor `Retry-After` when provided; otherwise they use exponential backoff with jitter.
- Each fetcher reports whether its request succeeded. Existing member snapshots retain prior platform values when a fetch fails.
- A new member's initial snapshot is skipped when any linked platform is unavailable, preventing misleading zero-valued records.

## GitHub Actions protection

- Added a workflow concurrency group so scheduled and manually dispatched syncs cannot overlap.

## Verification

- Verified direct CodeChef values for the supplied accounts, including `zesty_wasp_34` (161 solved, rating 1255).
- Verified Codeforces fetch success and solved-problem retrieval.
- Added tests for CodeChef parsing, retry timing, skipped initial snapshots, and retention of existing records after a failed fetch.
