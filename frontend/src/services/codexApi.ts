import { supabase } from "../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  snapshot_date: string;
  total_score: number;
  active_days: number;
  current_streak: number;
  dsa_score: number;
  dev_score: number;
  github_prs: number;
  github_issues: number;
  leetcode_total: number;
  leetcode_easy: number;
  leetcode_medium: number;
  leetcode_hard: number;
  codeforces_solved?: number;
  codechef_solved?: number;
  gfg_solved?: number;
  github_contributions: number;
  raw_github_commits: number;
  valid_github_commits: number;
  codeforces_rating: number;
  codechef_rating: number;
  hackerrank_badges: number;
  contests_attended: number;
  members: {
    id: string;
    full_name: string;
    roll_number: string | null;
    avatar_url: string | null;
    github_handle: string | null;
  };
}

// ── Service ────────────────────────────────────────────────────────────────

/**
 * Fetches today's leaderboard from Supabase.
 *
 * Query:
 *   SELECT activity_snapshots.*, members(id, full_name, roll_number, avatar_url, github_handle)
 *   FROM activity_snapshots
 *   WHERE snapshot_date = <today UTC>
 *   ORDER BY total_score DESC
 *
 * The foreign-key join on `member_id → members.id` is expressed via Supabase's
 * PostgREST syntax: `members(...)` inside the select string.
 */
export async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" UTC

  const selectFields = `
    id,
    snapshot_date,
    total_score,
    active_days,
    current_streak,
    dsa_score,
    dev_score,
    github_prs,
    github_issues,
    leetcode_total,
    leetcode_easy,
    leetcode_medium,
    leetcode_hard,
    codeforces_solved,
    codechef_solved,
    gfg_solved,
    github_contributions,
    raw_github_commits,
    valid_github_commits,
    codeforces_rating,
    codechef_rating,
    hackerrank_badges,
    contests_attended,
    members (
      id,
      full_name,
      roll_number,
      avatar_url,
      github_handle
    )
  `;

  // 1. Try today's snapshot
  const { data: todayData, error: todayError } = await supabase
    .from("activity_snapshots")
    .select(selectFields)
    .eq("snapshot_date", today)
    .order("total_score", { ascending: false });

  if (todayError) {
    console.error("[codexApi] getDailyLeaderboard error:", todayError.message);
  }

  if (todayData && todayData.length > 0) {
    return todayData as unknown as LeaderboardEntry[];
  }

  // 2. Fallback: If today's sync hasn't run yet, fetch the most recent completed snapshot date
  const { data: latestSnap, error: latestError } = await supabase
    .from("activity_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError || !latestSnap?.snapshot_date) {
    return [];
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("activity_snapshots")
    .select(selectFields)
    .eq("snapshot_date", latestSnap.snapshot_date)
    .order("total_score", { ascending: false });

  if (fallbackError) {
    console.error("[codexApi] getDailyLeaderboard fallback error:", fallbackError.message);
    return [];
  }

  return (fallbackData ?? []) as unknown as LeaderboardEntry[];
}

// ── Club Activity Map ──────────────────────────────────────────────────────

/** Shape required by react-activity-calendar */
export interface ActivityDay {
  date: string;           // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * Maps a raw count to a level 0-4 relative to the max count in the dataset.
 *  0 → no activity
 *  1-4 → quartile-based intensity
 */
function countToLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Fetches the pre-aggregated `club_daily_activity` view from Supabase
 * and returns data formatted for `react-activity-calendar`.
 *
 * View shape: { date: string, count: number }
 */
export async function getClubActivityMap(): Promise<ActivityDay[]> {
  const { data, error } = await supabase
    .from("club_daily_activity")
    .select("date, count")
    .order("date", { ascending: true });

  if (error) {
    console.error("[codexApi] getClubActivityMap error:", error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as { date: string; count: number }[];
  const max = Math.max(0, ...rows.map((r) => r.count));

  return rows.map((r) => ({
    date: r.date,
    count: r.count,
    level: countToLevel(r.count, max),
  }));
}

// ── Club GitHub Heatmap ───────────────────────────────────────────────────

export async function getClubGithubHeatmap(): Promise<ActivityDay[]> {
  const { data, error } = await supabase
    .from("club_github_history")
    .select("date, commits")
    .order("date", { ascending: true });

  if (error) {
    console.error("[codexApi] getClubGithubHeatmap error:", error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as { date: string; commits: number }[];

  // Custom level scaling based on collective club volume
  const getLevel = (commits: number) => {
    if (commits === 0) return 0;
    if (commits <= 10) return 1;
    if (commits <= 30) return 2;
    if (commits <= 60) return 3;
    return 4; // 61+ commits in a single day
  };

  return rows.map((r) => ({
    date: r.date,
    count: r.commits,
    level: getLevel(r.commits),
  }));
}

// ── Club Stats Summary ─────────────────────────────────────────────────────

export interface ClubStatsSummary {
  total_leetcode: number;
  total_codeforces: number;
  total_codechef: number;
  total_gfg: number;
  total_hackerrank_badges: number;
  total_club_solved: number;
  total_fundamentals: number;
  total_dsa: number;
  total_cp: number;
  total_club_contests: number;
}

export async function getClubStatsSummary(): Promise<ClubStatsSummary> {
  const defaultStats: ClubStatsSummary = {
    total_leetcode: 0,
    total_codeforces: 0,
    total_codechef: 0,
    total_gfg: 0,
    total_hackerrank_badges: 0,
    total_club_solved: 0,
    total_fundamentals: 0,
    total_dsa: 0,
    total_cp: 0,
    total_club_contests: 0,
  };

  try {
    const { data, error } = await supabase
      .from("club_stats_summary")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("[codexApi] getClubStatsSummary error:", error.message);
      return defaultStats;
    }

    if (!data) return defaultStats;

    return {
      total_leetcode: data.total_leetcode || 0,
      total_codeforces: data.total_codeforces || 0,
      total_codechef: data.total_codechef || 0,
      total_gfg: data.total_gfg || 0,
      total_hackerrank_badges: data.total_hackerrank_badges || 0,
      total_club_solved: data.total_club_solved || 0,
      total_fundamentals: data.total_fundamentals || 0,
      total_dsa: data.total_dsa || 0,
      total_cp: data.total_cp || 0,
      total_club_contests: data.total_club_contests || 0,
    };
  } catch (err) {
    console.error("[codexApi] getClubStatsSummary error:", err);
    return defaultStats;
  }
}

// ── Member Profile ─────────────────────────────────────────────────────────

export interface MemberSnapshot {
  snapshot_date: string;
  total_score: number;
  dsa_score: number;
  dev_score: number;
  active_days: number;
  current_streak: number;
  max_streak: number;
  leetcode_easy: number;
  leetcode_medium: number;
  leetcode_hard: number;
  leetcode_total: number;
  gfg_school: number;
  gfg_basic: number;
  gfg_easy: number;
  gfg_medium: number;
  gfg_hard: number;
  github_contributions: number;
  raw_github_commits: number;
  valid_github_commits: number;
  github_prs: number;
  github_issues: number;
  codeforces_rating: number;
  codeforces_max_rating: number;
  codeforces_solved: number;
  codechef_rating: number;
  codechef_max_rating: number;
  codechef_solved: number;
  leetcode_rating: number;
  leetcode_max_rating: number;
  gfg_solved: number;
  gfg_score: number;
  hackerrank_badges: number;
  contests_attended: number;
  leetcode_contests: number;
  codeforces_contests: number;
  codechef_contests: number;
  topic_stats: Record<string, number> | null;
  badges_detail: Record<string, unknown> | null;
}

export interface MemberProfile {
  id: string;
  full_name: string;
  roll_number: string | null;
  avatar_url: string | null;
  github_handle: string | null;
  leetcode_handle: string | null;
  codeforces_handle: string | null;
  codechef_handle: string | null;
  gfg_handle: string | null;
  hackerrank_handle: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  snapshot: MemberSnapshot | null;
}

/**
 * Fetches a member profile by github_handle (tried first) or roll_number,
 * along with their most recent activity_snapshot row.
 */
export async function getMemberProfile(handle: string): Promise<MemberProfile | null> {
  for (const field of ["github_handle", "roll_number"] as const) {
    const { data: members, error } = await supabase
      .from("members")
      .select(
        "id, full_name, roll_number, avatar_url, github_handle, leetcode_handle, codeforces_handle, codechef_handle, gfg_handle, hackerrank_handle, bio, linkedin_url, github_url, portfolio_url"
      )
      .eq(field, handle)
      .limit(1);

    if (error) {
      console.error("[codexApi] getMemberProfile error:", error.message);
      throw new Error(error.message);
    }

    if (!members || members.length === 0) continue;

    const member = members[0] as Omit<MemberProfile, "snapshot">;

    const { data: snapshots } = await supabase
      .from("activity_snapshots")
      .select(
        `snapshot_date, total_score, dsa_score, dev_score, active_days, current_streak, max_streak,
         leetcode_easy, leetcode_medium, leetcode_hard, leetcode_total,
         leetcode_rating, leetcode_max_rating,
         gfg_school, gfg_basic, gfg_easy, gfg_medium, gfg_hard, gfg_solved, gfg_score,
         github_contributions, raw_github_commits, valid_github_commits, github_prs, github_issues, codeforces_rating, codeforces_max_rating, codeforces_solved,
         codechef_rating, codechef_max_rating, codechef_solved,
         hackerrank_badges, contests_attended, leetcode_contests, codeforces_contests, codechef_contests, topic_stats, badges_detail`
      )
      .eq("member_id", member.id)
      .order("snapshot_date", { ascending: false })
      .limit(1);

    return {
      ...member,
      snapshot:
        snapshots && snapshots.length > 0
          ? (snapshots[0] as MemberProfile["snapshot"])
          : null,
    };
  }

  return null;
}

// ── Monthly Leaderboard ────────────────────────────────────────────────────

export interface MonthlyLeaderboardEntry {
  member_id: string;
  full_name: string;
  handle: string;
  avatar_url: string | null;
  monthly_total_score: number;
  monthly_dsa_score: number;
  monthly_dev_score: number;
  monthly_problems_solved: number;
  monthly_commits: number;
  monthly_prs: number;
  monthly_leetcode: number;
  monthly_codeforces: number;
  monthly_codechef: number;
  monthly_gfg: number;
  current_streak: number;
}

export async function getMonthlyLeaderboard(): Promise<MonthlyLeaderboardEntry[]> {
  try {
    const now = new Date();
    // Get the last day of the previous month in UTC to use as the true baseline
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-indexed
    const lastDayPrevMonth = new Date(Date.UTC(year, month, 0));
    const lastDayStr = lastDayPrevMonth.toISOString().split("T")[0];

    // Step B: Query active members
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, full_name, github_handle, avatar_url")
      .eq("is_active", true);

    if (membersError) {
      console.error("[codexApi] getMonthlyLeaderboard members error:", membersError.message);
      return [];
    }

    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Step C: Query activity_snapshots with pagination to avoid 1,000-row PostgREST ceiling
    const PAGE_SIZE = 1000;
    let snapshots: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: snapshotsError } = await supabase
        .from("activity_snapshots")
        .select(`
          member_id,
          snapshot_date,
          total_score,
          dsa_score,
          dev_score,
          leetcode_total,
          codeforces_solved,
          codechef_solved,
          gfg_solved,
          github_contributions,
          raw_github_commits,
          valid_github_commits,
          github_prs,
          current_streak
        `)
        .gte("snapshot_date", lastDayStr)
        .in("member_id", memberIds)
        .order("snapshot_date", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (snapshotsError) {
        console.error("[codexApi] getMonthlyLeaderboard snapshots error:", snapshotsError.message);
        return [];
      }

      if (pageData && pageData.length > 0) {
        snapshots = snapshots.concat(pageData);
        if (pageData.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      } else {
        hasMore = false;
      }
    }

    // Step D: Group by member_id
    const snapshotsByMember = new Map<string, any[]>();
    for (const snap of (snapshots || [])) {
      if (!snapshotsByMember.has(snap.member_id)) {
        snapshotsByMember.set(snap.member_id, []);
      }
      snapshotsByMember.get(snap.member_id)!.push(snap);
    }

    const results: MonthlyLeaderboardEntry[] = [];

    for (const member of members) {
      const memberSnaps = snapshotsByMember.get(member.id) || [];

      if (memberSnaps.length === 0) {
        results.push({
          member_id: member.id,
          full_name: member.full_name,
          handle: member.github_handle || member.id,
          avatar_url: member.avatar_url,
          monthly_total_score: 0,
          monthly_dsa_score: 0,
          monthly_dev_score: 0,
          monthly_problems_solved: 0,
          monthly_commits: 0,
          monthly_prs: 0,
          monthly_leetcode: 0,
          monthly_codeforces: 0,
          monthly_codechef: 0,
          monthly_gfg: 0,
          current_streak: 0,
        });
        continue;
      }

      const baseline = memberSnaps[0];
      const latest = memberSnaps[memberSnaps.length - 1];


        
      const getCommits = (s: any) => s.valid_github_commits || s.github_contributions || 0;


      // If only 1 snapshot exists in this month (e.g. baseline is latest), delta is 0
      const isSingleSnap = memberSnaps.length <= 1;

      let monthly_problems_solved = 0;
      let monthly_leetcode = 0;
      let monthly_codeforces = 0;
      let monthly_codechef = 0;
      let monthly_gfg = 0;
      if (!isSingleSnap) {
        for (let i = 1; i < memberSnaps.length; i++) {
          const prev = memberSnaps[i - 1];
          const curr = memberSnaps[i];
          
          const processPlatform = (pVal: number | undefined | null, cVal: number | undefined | null) => {
            const p = pVal || 0;
            const c = cVal || 0;
            const delta = Math.max(0, c - p);
            
            // Backfill protection: If jumping from 0 to a large number in one day (e.g. adding an existing handle),
            // cap initial daily surge to 10 rather than completely zeroing genuine first-day progress.
            if (p === 0 && delta > 10) return 10;
            
            // Hard cap for daily spam or extreme glitches
            if (delta > 30) return 30;
            
            return delta;
          };

          const lcDelta = processPlatform(prev.leetcode_total, curr.leetcode_total);
          const cfDelta = processPlatform(prev.codeforces_solved, curr.codeforces_solved);
          const ccDelta = processPlatform(prev.codechef_solved, curr.codechef_solved);
          const gfgDelta = processPlatform(prev.gfg_solved, curr.gfg_solved);

          monthly_leetcode += lcDelta;
          monthly_codeforces += cfDelta;
          monthly_codechef += ccDelta;
          monthly_gfg += gfgDelta;
          monthly_problems_solved += (lcDelta + cfDelta + ccDelta + gfgDelta);
        }
      }

      const monthly_commits = isSingleSnap ? 0 : Math.max(0, getCommits(latest) - getCommits(baseline));
      const monthly_prs = isSingleSnap ? 0 : Math.max(0, (latest.github_prs || 0) - (baseline.github_prs || 0));

      results.push({
        member_id: member.id,
        full_name: member.full_name,
        handle: member.github_handle || member.id,
        avatar_url: member.avatar_url,
        monthly_total_score: isSingleSnap ? 0 : Math.max(0, (latest.total_score || 0) - (baseline.total_score || 0)),
        monthly_dsa_score: monthly_problems_solved,
        monthly_dev_score: monthly_commits + monthly_prs,
        monthly_problems_solved,
        monthly_commits,
        monthly_prs,
        monthly_leetcode,
        monthly_codeforces,
        monthly_codechef,
        monthly_gfg,
        current_streak: latest.current_streak || 0,
      });
    }

    // Sort descending by monthly_total_score, with tie-breaking on monthly_dsa_score then current_streak
    return results.sort((a, b) => {
      if (b.monthly_total_score !== a.monthly_total_score) {
        return b.monthly_total_score - a.monthly_total_score;
      }
      if (b.monthly_dsa_score !== a.monthly_dsa_score) {
        return b.monthly_dsa_score - a.monthly_dsa_score;
      }
      return (b.current_streak || 0) - (a.current_streak || 0);
    });
  } catch (err) {
    console.error("[codexApi] getMonthlyLeaderboard unexpected error:", err);
    return [];
  }
}

