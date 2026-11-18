import { useState, useEffect, useMemo } from "react";
import { getDailyLeaderboard, getClubStatsSummary, getClubGithubHeatmap } from "../services/codexApi";
import type { ClubStatsSummary, ActivityDay } from "../services/codexApi";

export interface LeaderboardMember {
  id: string;
  rank: number;
  globalRank: number;
  dsaRank: number;
  devRank: number;
  handle: string;
  full_name: string;
  avatar_url: string | null;
  total_score: number;
  dsa_score: number;
  dev_score: number;
  daily_score_delta: number;
  current_streak: number;
  leetcode_total: number;
  total_solved: number;
  total_contributions: number;
  contests_attended: number;
  valid_github_commits: number;
  codeforces_rating: number;
  codechef_rating: number;
  hackerrank_badges: number;
}

export type SortMode = 'GLOBAL' | 'DSA' | 'DEV';

export function useLeaderboard() {
  const [rawMembers, setRawMembers] = useState<LeaderboardMember[]>([]);
  const [clubSummary, setClubSummary] = useState<ClubStatsSummary | null>(null);
  const [githubHeatmap, setGithubHeatmap] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("GLOBAL");

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [lbData, statsData, heatmapData] = await Promise.all([
          getDailyLeaderboard(),
          getClubStatsSummary(),
          getClubGithubHeatmap().catch(() => [])
        ]);

        if (!cancelled) {
          // Compute rank for each category independently
          const globalSorted = [...lbData].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
          const globalRankMap = new Map(globalSorted.map((item, idx) => [item.id, idx + 1]));

          const dsaSorted = [...lbData].sort((a, b) => (b.dsa_score || 0) - (a.dsa_score || 0));
          const dsaRankMap = new Map(dsaSorted.map((item, idx) => [item.id, idx + 1]));

          const devSorted = [...lbData].sort((a, b) => (b.dev_score || 0) - (a.dev_score || 0));
          const devRankMap = new Map(devSorted.map((item, idx) => [item.id, idx + 1]));

          const mappedMembers: LeaderboardMember[] = lbData.map((entry) => {
            const calculatedTotalSolved = 
              (entry.leetcode_total || 0) + 
              (entry.codeforces_solved || 0) + 
              (entry.codechef_solved || 0) + 
              (entry.gfg_solved || 0);

            const calculatedContributions = 
              (entry.github_contributions || 0) || 
              (entry.valid_github_commits || 0);

            return {
              id: entry.id,
              rank: globalRankMap.get(entry.id) || 1, // Default global rank
              globalRank: globalRankMap.get(entry.id) || 1,
              dsaRank: dsaRankMap.get(entry.id) || 1,
              devRank: devRankMap.get(entry.id) || 1,
              handle: entry.members.github_handle ?? "",
              full_name: entry.members.full_name ?? "—",
              avatar_url: entry.members.avatar_url,
              total_score: entry.total_score,
              dsa_score: entry.dsa_score,
              dev_score: entry.dev_score,
              daily_score_delta: 0,
              current_streak: entry.current_streak,
              leetcode_total: entry.leetcode_total,
              total_solved: calculatedTotalSolved,
              total_contributions: calculatedContributions,
              contests_attended: entry.contests_attended,
              valid_github_commits: entry.valid_github_commits,
              codeforces_rating: entry.codeforces_rating,
              codechef_rating: entry.codechef_rating,
              hackerrank_badges: entry.hackerrank_badges,
            };
          });

          setRawMembers(mappedMembers);
          setClubSummary(statsData);
          setGithubHeatmap(heatmapData);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const members = useMemo(() => {
    // 1. First assign active category rank and sort score by active sortMode
    const membersWithCategoryRank = rawMembers.map((m) => {
      let activeRank = m.globalRank;
      let activeScore = m.total_score;

      if (sortMode === "DSA") {
        activeRank = m.dsaRank;
        activeScore = m.dsa_score;
      } else if (sortMode === "DEV") {
        activeRank = m.devRank;
        activeScore = m.dev_score;
      }

      return {
        ...m,
        rank: activeRank,
        activeScore,
      };
    });

    // 2. Sort full list by active category score descending
    const sorted = membersWithCategoryRank.sort((a, b) => b.activeScore - a.activeScore);

    // 3. Filter by search query while maintaining assigned category rank
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return sorted.filter(m => 
        m.full_name.toLowerCase().includes(q) || 
        m.handle.toLowerCase().includes(q)
      );
    }

    return sorted;
  }, [rawMembers, searchQuery, sortMode]);

  return {
    members,
    clubSummary,
    githubHeatmap,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode
  };
}
