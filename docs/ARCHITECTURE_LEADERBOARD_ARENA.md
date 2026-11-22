# ⚔️ CODEX Activity Tracker: Leaderboard & Arena Architecture

> **Notice:** The comprehensive, production-grade technical specification and architecture manual is maintained in:  
> 🔗 **[`ARENA_AND_LEADERBOARD_README.md`](../ARENA_AND_LEADERBOARD_README.md)**

---

## 1. Database Schema (Supabase PostgreSQL)

The platform revolves around two primary tables in Supabase: `members` and `activity_snapshots`, with an auxiliary table `club_github_history`.

### A. `members` Table
Acts as the source of truth for user identities and linked competitive handles.

*   `id` (UUID) - Primary key, linked to Supabase Auth.
*   `full_name`, `roll_number`, `bio`, `avatar_url` - Profile metadata.
*   `github_url`, `linkedin_url`, `portfolio_url` - Social links.
*   `is_active` (BOOLEAN) - Filter for active tracker participants.
*   **Platform Handles:** `github_handle`, `leetcode_handle`, `codeforces_handle`, `codechef_handle`, `gfg_handle`, `hackerrank_handle`.

### B. `activity_snapshots` Table (Time-Series Engine)
Time-series table holding daily snapshots for each member.
*   **Unique Constraint:** `(member_id, snapshot_date)`
*   **Calculated Scores:** `total_score` (Bounded 0-1200), `dsa_score` (0-500), `dev_score` (0-500).
*   **Aggregated Global Metrics:** `active_days`, `current_streak`, `max_streak`, `contests_attended`.
*   **Platform-Specific Metrics:**
    *   **LeetCode:** `leetcode_easy`, `leetcode_medium`, `leetcode_hard`, `leetcode_total`, `leetcode_rating`, `leetcode_max_rating`, `leetcode_contests`
    *   **Codeforces:** `codeforces_rating`, `codeforces_max_rating`, `codeforces_solved`, `codeforces_contests`, `codeforces_rank_title`
    *   **CodeChef:** `codechef_rating`, `codechef_max_rating`, `codechef_solved`, `codechef_contests`
    *   **GeeksForGeeks:** `gfg_solved`, `gfg_school`, `gfg_basic`, `gfg_easy`, `gfg_medium`, `gfg_hard`, `gfg_score`
    *   **HackerRank:** `hackerrank_badges`
    *   **GitHub:** `github_contributions`, `github_repos`, `github_prs`, `github_issues`, `raw_github_commits`, `valid_github_commits`
*   **JSONB Metadata:** `topic_stats` (tag/topic counts), `badges_detail` (badges metadata and icons).

### C. `club_github_history` Table
Stores rolling 365-day aggregated daily contributions for the entire community. Powers `ClubActivityCalendar.tsx`.

---

## 2. Ingestion Pipeline & Reliability Guardrails (`scripts/`)

*   **Concurrency & Rate Limiting (`scripts/main.py`):** Runs asynchronously with `aiohttp` in chunks (`CHUNK_SIZE = 10`) with `INTER_CHUNK_SLEEP = 3s` and strict timeouts to prevent `HTTP 429` rate-limit blocks.
*   **Monotonicity Enforcement:** Metrics never decrease due to API outages or dropped connections; falls back to `yesterday_snap`.
*   **Anti-Spam Commit Throttling:** Caps daily GitHub contributions at +15 valid commits per day (`raw_github_commits` vs `valid_github_commits`).
*   **Unified Global Streak:** Cross-platform activity detection using daily net activity deltas.
*   **Auto-Onboarding Baseline Seeding:** Automatically creates a Day-1 baseline snapshot for members joining mid-month to prevent legacy scores from skewing the monthly Arena.

---

## 3. Mathematical Scoring Engine (`scripts/scoring.py`)

*   **Total Score:** Bounded at 1,200 points maximum.
*   **DSA Score (Max 500 Pts):**
    *   Contest Ratings (Max 250): Codeforces (Max 100), LeetCode (Max 100), CodeChef (Max 50).
    *   Problem Volume (Max 150): LeetCode weighted (1x/3x/6x), Codeforces (target 250), GFG/CodeChef/HackerRank combined.
    *   Contests Attended (Max 100): Target 50 contests.
*   **Development Score (Max 500 Pts):**
    *   Commits (Max 100): Target 1,000 valid commits (0.1 pts/commit).
    *   Pull Requests (Max 175): Target 20 PRs (heavy collaborative incentive).
    *   Issues (Max 75): Target 25 issues.
    *   Repositories (Max 150): Target 30 repositories (5.0 pts/repo).
*   **Consistency Bonus (Max 200 Pts):**
    *   Active Days (Max 100): Target 150 days.
    *   Max Streak (Max 100): Target 30-day streak.

---

## 4. The Arena: Monthly Combat Engine (`Arena.tsx` & `codexApi.ts`)

*   **Monthly Reset:** Tracks pure delta within the active month (baseline = last day of previous month).
*   **Scraper Backfill Detection:** Daily iteration prevents artificial score jumps when a member adds a handle mid-month (jumps from 0 to >10 in 1 day are ignored).
*   **Daily Problem Surge Cap:** Capped at 30 problems per platform per day.
*   **Transparent Verification:** Displays verifiable platform breakdowns (`LC: X | CF: Y | CC: Z | GFG: W`) on every combat card.
*   **Division XP:**
    *   Algorithms: Monthly problems solved across LC + CF + CC + GFG.
    *   Development: Monthly valid commits + monthly PRs.
*   **Dynamic Threat Radar:** Real-time gap counter: `+N XP TO OVERTAKE #<rank-1>`.

---

## 5. Automation Workflow (`.github/workflows/sync.yml`)

*   **Schedule:** Runs twice daily at `00:00` and `12:00` UTC via GitHub Actions cron, plus `workflow_dispatch`.
*   **Environment Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LEADERBOARD_GH_PAT`.
*   **Full Guide:** See [`ARENA_AND_LEADERBOARD_README.md`](../ARENA_AND_LEADERBOARD_README.md) for full execution traces and local setup instructions.
