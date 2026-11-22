import { StaggerItem } from "../animations/ScrollReveal";
import { MetricCard } from "./MetricCard";
import type { MemberSnapshot } from "../../services/codexApi";
import type { DerivedStats } from "../../hooks/useMemberProfile";

export interface HeroMetricsProps {
  stats: MemberSnapshot;
  derived: DerivedStats;
}

export function HeroMetrics({ stats, derived }: HeroMetricsProps) {
  if (!stats) return null;
  return (
    <StaggerItem>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0707f2] text-white border-4 border-slate-900 p-5 brutalist-shadow flex flex-col justify-between min-h-[110px] hover:-translate-y-1 hover:-translate-x-1 transition-transform">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Total Solved</span>
          <div className="flex items-end gap-1 mt-2">
            <span className="text-4xl font-black leading-none">{derived.individualTotalSolved}</span>
          </div>
        </div>
        <MetricCard label="Total Score" value={Math.round(stats.total_score)} accent />
        <MetricCard label="Current Streak" value={stats.current_streak} unit="days" />
        <MetricCard label="Max Streak" value={stats.max_streak} unit="days" />
        <MetricCard label="Active Days" value={stats.active_days} unit="days" />
      </div>
    </StaggerItem>
  );
}
