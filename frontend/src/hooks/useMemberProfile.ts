import { useState, useEffect } from "react";
import { getMemberProfile, type MemberProfile } from "../services/codexApi";
export interface DerivedStats {
  lcTotal: number;
  gfgTotal: number;
  individualTotalSolved: number;
  skillFundamentals: number;
  skillDsa: number;
  skillCp: number;
  totalSkill: number;
}

export function useMemberProfile(handle: string) {
  const [profile, setProfile] = useState<MemberProfile | null | undefined>(
    undefined // undefined = loading, null = not found
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;

    (async () => {
      try {
        setProfile(undefined);
        setError(null);
        const data = await getMemberProfile(handle);
        if (!cancelled) setProfile(data); // null → not found
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setProfile(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  const loading = profile === undefined && !error;
  const latestSnapshot = profile?.snapshot ?? null;

  // LeetCode totals for bar calc
  const lcTotal = latestSnapshot
    ? latestSnapshot.leetcode_easy +
      latestSnapshot.leetcode_medium +
      latestSnapshot.leetcode_hard
    : 0;

  // GFG totals
  const gfgTotal = latestSnapshot
    ? latestSnapshot.gfg_school +
      latestSnapshot.gfg_basic +
      latestSnapshot.gfg_easy +
      latestSnapshot.gfg_medium +
      latestSnapshot.gfg_hard
    : 0;

  // Individual Total Solved across platforms (LeetCode + Codeforces + CodeChef + GFG)
  const individualTotalSolved = latestSnapshot
    ? (latestSnapshot.leetcode_total || 0) +
      (latestSnapshot.codeforces_solved || 0) +
      (latestSnapshot.codechef_solved || 0) +
      (latestSnapshot.gfg_solved || 0)
    : 0;

  // Skill Distribution Categories
  const skillFundamentals = latestSnapshot
    ? (latestSnapshot.gfg_school || 0) +
      (latestSnapshot.gfg_basic || 0) +
      (latestSnapshot.gfg_easy || 0)
    : 0;
  const skillDsa = latestSnapshot
    ? (latestSnapshot.leetcode_easy || 0) +
      (latestSnapshot.leetcode_medium || 0) +
      (latestSnapshot.gfg_medium || 0) +
      (latestSnapshot.gfg_hard || 0)
    : 0;
  const skillCp = latestSnapshot
    ? (latestSnapshot.codeforces_solved || 0) +
      (latestSnapshot.codechef_solved || 0) +
      (latestSnapshot.leetcode_hard || 0)
    : 0;
  const totalSkill = skillFundamentals + skillDsa + skillCp;

  // Safely extract numeric counts from topic_stats regardless of nesting depth.
  function toCount(val: unknown): number {
    if (typeof val === "number") return val;
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      for (const key of ["count", "total", "solved", "value", "problems"]) {
        if (typeof obj[key] === "number") return obj[key] as number;
      }
      const nums = Object.values(obj).filter(
        (v) => typeof v === "number"
      ) as number[];
      if (nums.length > 0) return nums.reduce((a, b) => a + b, 0);
    }
    return 0;
  }

  function aggregateTopics(stats: unknown): [string, number][] {
    if (!stats || typeof stats !== "object") return [];
    const counts = new Map<string, number>();

    for (const platformData of Object.values(stats as Record<string, unknown>)) {
      if (platformData && typeof platformData === "object") {
        for (const [rawTopic, val] of Object.entries(
          platformData as Record<string, unknown>
        )) {
          const count = toCount(val);
          if (count > 0) {
            const normalized = rawTopic
              .replace(/[-_]/g, " ")
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")
              .trim();
            counts.set(normalized, (counts.get(normalized) || 0) + count);
          }
        }
      }
    }
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20); // Top 20 topics
  }

  const sortedTopics = aggregateTopics(latestSnapshot?.topic_stats);
  const badges =
    (latestSnapshot?.badges_detail as unknown as Array<{
      platform: string;
      id: string;
      name: string;
      icon?: string;
    }>) || [];

  return {
    profile,
    latestSnapshot,
    loading,
    error,
    derivedStats: {
      lcTotal,
      gfgTotal,
      individualTotalSolved,
      skillFundamentals,
      skillDsa,
      skillCp,
      totalSkill,
    },
    sortedTopics,
    badges,
  };
}
