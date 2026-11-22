import { StaggerItem } from "../animations/ScrollReveal";
import type { MemberSnapshot } from "../../services/codexApi";
import { Label, SectionTitle } from "./SharedStyles";

export function ContestRankings({ stats }: { stats: MemberSnapshot }) {
  if (!stats) return null;
  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white p-6 md:p-8 brutalist-shadow">
        <div className="mb-6">
          <Label>Competitive</Label>
          <SectionTitle>Contest Rankings</SectionTitle>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-slate-900 p-5 flex flex-col items-center justify-center text-center brutalist-shadow-sm hover:-translate-y-1 transition-transform bg-white">
            <span className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">LeetCode</span>
            <span className={`font-black leading-none ${stats.leetcode_rating ? 'text-6xl text-slate-900' : 'text-5xl text-slate-400'}`}>
              {stats.leetcode_rating || "UNRATED"}
            </span>
            {stats.leetcode_max_rating > 0 && (
              <span className="text-xs font-bold uppercase text-slate-500 mt-2">
                (max: {stats.leetcode_max_rating})
              </span>
            )}
            <div className="mt-4 pt-3 border-t-2 border-slate-200 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Contests Fought</span>
              <span className="text-xl font-black text-slate-900 leading-none">{stats.leetcode_contests || 0}</span>
            </div>
          </div>
          <div className="border-4 border-slate-900 p-5 flex flex-col items-center justify-center text-center brutalist-shadow-sm hover:-translate-y-1 transition-transform bg-white">
            <span className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">CodeChef</span>
            <span className={`font-black leading-none ${stats.codechef_rating ? 'text-6xl text-slate-900' : 'text-5xl text-slate-400'}`}>
              {stats.codechef_rating || "UNRATED"}
            </span>
            {stats.codechef_max_rating > 0 && (
              <span className="text-xs font-bold uppercase text-slate-500 mt-2">
                (max: {stats.codechef_max_rating})
              </span>
            )}
            <div className="mt-4 pt-3 border-t-2 border-slate-200 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Contests Fought</span>
              <span className="text-xl font-black text-slate-900 leading-none">{stats.codechef_contests || 0}</span>
            </div>
          </div>
          <div className="border-4 border-slate-900 p-5 flex flex-col items-center justify-center text-center brutalist-shadow-sm hover:-translate-y-1 transition-transform bg-white">
            <span className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Codeforces</span>
            <span className={`font-black leading-none ${stats.codeforces_rating ? 'text-6xl text-slate-900' : 'text-5xl text-slate-400'}`}>
              {stats.codeforces_rating || "UNRATED"}
            </span>
            {stats.codeforces_max_rating > 0 && (
              <span className="text-xs font-bold uppercase text-slate-500 mt-2">
                (max: {stats.codeforces_max_rating})
              </span>
            )}
            <div className="mt-4 pt-3 border-t-2 border-slate-200 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Contests Fought</span>
              <span className="text-xl font-black text-slate-900 leading-none">{stats.codeforces_contests || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </StaggerItem>
  );
}
