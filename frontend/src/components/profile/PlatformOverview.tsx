import { useState } from "react";
import { StaggerItem } from "../animations/ScrollReveal";
import type { MemberProfile, MemberSnapshot } from "../../services/codexApi";
import { Label, SectionTitle } from "./SharedStyles";
import { PlatformPill } from "./PlatformPill";
import { PlatformCard, StatRow } from "./PlatformCard";

export interface PlatformOverviewProps {
  profile: MemberProfile;
  stats: MemberSnapshot;
}

interface PlatformSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  hoverColor: string;
}

function getDonutPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startAngle: number,
  endAngle: number
) {
  const angleDiff = endAngle - startAngle;
  const effectiveEndAngle = angleDiff >= 360 ? startAngle + 359.99 : endAngle;

  const rad1 = ((startAngle - 90) * Math.PI) / 180;
  const rad2 = ((effectiveEndAngle - 90) * Math.PI) / 180;

  const x1Out = cx + rOut * Math.cos(rad1);
  const y1Out = cy + rOut * Math.sin(rad1);
  const x2Out = cx + rOut * Math.cos(rad2);
  const y2Out = cy + rOut * Math.sin(rad2);

  const x1In = cx + rIn * Math.cos(rad1);
  const y1In = cy + rIn * Math.sin(rad1);
  const x2In = cx + rIn * Math.cos(rad2);
  const y2In = cy + rIn * Math.sin(rad2);

  const largeArc = angleDiff > 180 ? 1 : 0;

  return `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1In} ${y1In} Z`;
}

export function PlatformOverview({ profile, stats }: PlatformOverviewProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (!stats) return null;
  const lc = stats.leetcode_total || 0;
  const gfg = stats.gfg_solved || 0;
  const cf = stats.codeforces_solved || 0;
  const cc = stats.codechef_solved || 0;
  const totalVol = lc + gfg + cf + cc;

  const segments: PlatformSegment[] = [
    { key: "lc", label: "LeetCode", count: lc, color: "#facc15", hoverColor: "#fde047" },
    { key: "gfg", label: "GeeksForGeeks", count: gfg, color: "#22c55e", hoverColor: "#4ade80" },
    { key: "cf", label: "Codeforces", count: cf, color: "#ef4444", hoverColor: "#f87171" },
    { key: "cc", label: "CodeChef", count: cc, color: "#a855f7", hoverColor: "#c084fc" },
  ].filter((s) => s.count > 0);

  let currentAngle = 0;
  const chartSegments = segments.map((seg) => {
    const percentage = (seg.count / totalVol) * 100;
    const angleSpan = (seg.count / totalVol) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;

    return {
      ...seg,
      percentage,
      startAngle,
      endAngle,
      path: getDonutPath(100, 100, 80, 48, startAngle, endAngle),
    };
  });

  const activeSegment = chartSegments.find((s) => s.key === hoveredKey);

  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white p-6 md:p-8 brutalist-shadow">
        <div className="mb-6 flex justify-between items-end gap-4 flex-wrap">
          <div>
            <Label>Platforms</Label>
            <SectionTitle>Platform Overview</SectionTitle>
          </div>
          <div className="flex gap-2">
            <PlatformPill platform="Contests" value={stats.contests_attended ?? 0} />
          </div>
        </div>

        {totalVol > 0 && (
          <div className="mb-10 border-2 border-slate-900 bg-slate-50 p-6 brutalist-shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
              Solved Volume By Platform
            </h4>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              {/* SVG Donut Chart */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center flex-shrink-0">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full drop-shadow-[3px_3px_0px_#0f172a]"
                >
                  {chartSegments.map((seg) => {
                    const isHovered = hoveredKey === seg.key;
                    return (
                      <path
                        key={seg.key}
                        d={seg.path}
                        fill={isHovered ? seg.hoverColor : seg.color}
                        stroke="#0f172a"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transformOrigin: "100px 100px",
                          transform: isHovered ? "scale(1.05)" : "scale(1)",
                        }}
                        onMouseEnter={() => setHoveredKey(seg.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                      />
                    );
                  })}
                </svg>

                {/* Central Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center">
                  <div className="bg-white border-2 border-slate-900 px-2.5 py-1 brutalist-shadow-sm max-w-[120px] truncate">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 block truncate">
                      {activeSegment ? activeSegment.label : "Total Volume"}
                    </span>
                    <span className="text-xs md:text-sm font-black text-slate-900 block">
                      {activeSegment
                        ? `${activeSegment.count} (${Math.round(activeSegment.percentage)}%)`
                        : `${totalVol}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="flex flex-wrap md:flex-col gap-3 w-full md:w-auto">
                {chartSegments.map((seg) => {
                  const isHovered = hoveredKey === seg.key;
                  return (
                    <div
                      key={seg.key}
                      onMouseEnter={() => setHoveredKey(seg.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      className={`flex items-center justify-between gap-4 px-3 py-2 border-2 border-slate-900 transition-all cursor-pointer brutalist-shadow-sm ${
                        isHovered
                          ? "bg-[#FACC15] -translate-y-0.5 shadow-[3px_3px_0px_0px_#0f172a]"
                          : "bg-white hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 border-2 border-slate-900 flex-shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                          {seg.label}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 ml-4">
                        {seg.count} ({Math.round(seg.percentage)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(Boolean(profile.leetcode_handle) || (stats.leetcode_total || 0) > 0) && (
            <PlatformCard platform="LeetCode" href={profile.leetcode_handle ? `https://leetcode.com/u/${profile.leetcode_handle}/` : null}>
              <StatRow label="Total Solved" value={stats.leetcode_total || 0} />
              <StatRow label="Contest Rating" value={Math.round(stats.leetcode_rating) || 0} />
              <StatRow label="Max Rating" value={Math.round(stats.leetcode_max_rating) || 0} />
            </PlatformCard>
          )}

          {(Boolean(profile.gfg_handle) || (stats.gfg_solved || 0) > 0 || (stats.gfg_score || 0) > 0) && (
            <PlatformCard platform="GeeksForGeeks" href={profile.gfg_handle ? `https://auth.geeksforgeeks.org/user/${profile.gfg_handle}` : null}>
              <StatRow label="Score" value={stats.gfg_score || 0} />
              <StatRow label="Solved" value={stats.gfg_solved || 0} />
              <StatRow label="Coding Score" value={stats.gfg_score || 0} />
            </PlatformCard>
          )}

          {(Boolean(profile.codeforces_handle) || (stats.codeforces_solved || 0) > 0 || (stats.codeforces_rating || 0) > 0) && (
            <PlatformCard platform="Codeforces" href={profile.codeforces_handle ? `https://codeforces.com/profile/${profile.codeforces_handle}` : null}>
              <StatRow label="Rank" value={stats.codeforces_rating > 0 ? "Rated" : "Unrated"} />
              <StatRow label="Rating" value={stats.codeforces_rating || 0} />
              <StatRow label="Max Rating" value={stats.codeforces_max_rating || 0} />
              <StatRow label="Solved" value={stats.codeforces_solved || 0} />
            </PlatformCard>
          )}

          {(Boolean(profile.codechef_handle) || (stats.codechef_solved || 0) > 0 || (stats.codechef_rating || 0) > 0) && (
            <PlatformCard platform="CodeChef" href={profile.codechef_handle ? `https://www.codechef.com/users/${profile.codechef_handle}` : null}>
              <StatRow label="Rating" value={stats.codechef_rating || 0} />
              <StatRow label="Max Rating" value={stats.codechef_max_rating || 0} />
              <StatRow label="Solved" value={stats.codechef_solved || 0} />
            </PlatformCard>
          )}

          {(Boolean(profile.github_handle) || (stats.valid_github_commits || 0) > 0) && (
            <PlatformCard platform="GitHub" href={profile.github_handle ? (profile.github_url || `https://github.com/${profile.github_handle}`) : null}>
              <StatRow label="Contributions" value={stats.valid_github_commits || 0} />
              <StatRow label="PRs Opened" value={stats.github_prs || 0} />
              <StatRow label="Issues" value={stats.github_issues || 0} />
            </PlatformCard>
          )}

          {(Boolean(profile.hackerrank_handle) || (stats.hackerrank_badges || 0) > 0) && (
            <PlatformCard platform="HackerRank" href={profile.hackerrank_handle ? `https://www.hackerrank.com/profile/${profile.hackerrank_handle}` : null}>
              <StatRow label="Badges" value={stats.hackerrank_badges || 0} />
            </PlatformCard>
          )}


        </div>
      </div>
    </StaggerItem>
  );
}

