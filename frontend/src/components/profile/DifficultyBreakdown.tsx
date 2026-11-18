import { StaggerItem } from "../animations/ScrollReveal";
import type { MemberSnapshot } from "../../services/codexApi";
import type { DerivedStats } from "../../hooks/useMemberProfile";
import { DiffBar } from "./DiffBar";

export interface DifficultyBreakdownProps {
  stats: MemberSnapshot;
  derived: DerivedStats;
}

export function DifficultyBreakdown({ stats, derived }: DifficultyBreakdownProps) {
  if (!stats || (derived.lcTotal === 0 && derived.gfgTotal === 0)) return null;
  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white p-6 md:p-8 brutalist-shadow">
        <div className="grid md:grid-cols-2 gap-10">
          {derived.lcTotal > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5 border-b-4 border-slate-900 pb-2">
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  LEETCODE
                </h3>
                <span className="text-sm font-black text-slate-400">
                  {derived.lcTotal} solved
                </span>
              </div>
              <div className="space-y-4">
                <DiffBar label="EASY" value={stats.leetcode_easy} total={derived.lcTotal} color="bg-[#00b8a3]" />
                <DiffBar label="MEDIUM" value={stats.leetcode_medium} total={derived.lcTotal} color="bg-[#ffc01e]" />
                <DiffBar label="HARD" value={stats.leetcode_hard} total={derived.lcTotal} color="bg-[#ef4743]" />
              </div>
            </div>
          )}
          {derived.gfgTotal > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5 border-b-4 border-slate-900 pb-2">
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  GFG
                </h3>
                <span className="text-sm font-black text-slate-400">
                  {derived.gfgTotal} solved
                </span>
              </div>
              <div className="space-y-4">
                <DiffBar label="SCHOOL" value={stats.gfg_school} total={derived.gfgTotal} color="bg-slate-300" />
                <DiffBar label="BASIC" value={stats.gfg_basic} total={derived.gfgTotal} color="bg-[#00b8a3]" />
                <DiffBar label="EASY" value={stats.gfg_easy} total={derived.gfgTotal} color="bg-[#10b981]" />
                <DiffBar label="MEDIUM" value={stats.gfg_medium} total={derived.gfgTotal} color="bg-[#ffc01e]" />
                <DiffBar label="HARD" value={stats.gfg_hard} total={derived.gfgTotal} color="bg-[#ef4743]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </StaggerItem>
  );
}

