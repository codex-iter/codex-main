import type { ClubStatsSummary } from "../../services/codexApi";

export default function ClubCommandCenter({ stats }: { stats: ClubStatsSummary }) {
  const totalSolved = stats.total_club_solved || 1;

  const platforms = [
    {
      name: "LeetCode",
      count: stats.total_leetcode,
      color: "#FFA116",
      pct: Math.round((stats.total_leetcode / totalSolved) * 100),
      tag: "SOLVED",
    },
    {
      name: "GeeksForGeeks",
      count: stats.total_gfg,
      color: "#2F8D46",
      pct: Math.round((stats.total_gfg / totalSolved) * 100),
      tag: "SOLVED",
    },
    {
      name: "Codeforces",
      count: stats.total_codeforces,
      color: "#3B82F6",
      pct: Math.round((stats.total_codeforces / totalSolved) * 100),
      tag: "SOLVED",
    },
    {
      name: "CodeChef",
      count: stats.total_codechef,
      color: "#D97706",
      pct: Math.round((stats.total_codechef / totalSolved) * 100),
      tag: "SOLVED",
    },
    {
      name: "HackerRank",
      count: stats.total_hackerrank_badges,
      color: "#2EC4B6",
      pct: null,
      tag: "BADGES",
    },
    {
      name: "Contests",
      count: stats.total_club_contests,
      color: "#FACC15",
      pct: null,
      tag: "FOUGHT",
    },
  ];

  return (
    <div className="border-4 border-slate-900 bg-white brutalist-shadow flex flex-col overflow-hidden relative">
      {/* ── Top Tactical Header Bar ── */}
      <div className="bg-slate-950 text-white px-4 py-3 border-b-4 border-slate-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-[#FACC15] text-slate-900 font-black px-2 py-0.5 text-xs uppercase tracking-wider border border-slate-900">
            SYS::COMMAND_CENTER
          </span>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b8a3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00b8a3]"></span>
            </span>
            <span className="hidden sm:inline">LIVE TELEMETRY STREAM</span>
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
          [ AGGREGATED CLUB MATRIX ]
        </div>
      </div>

      {/* ── Main Command Body (Sleek Dark Slate Theme) ── */}
      <div className="bg-slate-900 p-6 md:p-8 text-white relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />

        {/* Hero Metric Section (Left Column) */}
        <div className="lg:col-span-5 relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="inline-block bg-slate-800 text-[#FACC15] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 mb-3 border border-slate-700">
              CORE METRIC // CUMULATIVE
            </div>
            <div className="text-6xl sm:text-7xl md:text-8xl font-black leading-none tracking-tighter text-white drop-shadow-[4px_4px_0px_#000000]">
              {stats.total_club_solved.toLocaleString()}
            </div>
            <div className="text-sm font-black uppercase tracking-widest text-slate-400 mt-2 flex items-center gap-2">
              <span>TOTAL PROBLEMS SOLVED</span>
              <span className="h-2 w-2 bg-[#FACC15] inline-block animate-pulse" />
            </div>
          </div>

          {/* Proportional Contribution Bar */}
          <div className="mt-6 border-2 border-slate-700 p-3 bg-slate-950/80 backdrop-blur-sm">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>SOLVED VOLUME DISTRIBUTION</span>
              <span>100%</span>
            </div>
            <div className="h-3 w-full bg-slate-800 flex overflow-hidden border border-slate-700">
              {platforms
                .filter((p) => p.pct !== null && p.pct > 0)
                .map((p) => (
                  <div
                    key={p.name}
                    style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                    className="h-full transition-all duration-300 relative group"
                    title={`${p.name}: ${p.pct}%`}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] px-1.5 py-0.5 whitespace-nowrap border border-slate-700 pointer-events-none z-30 font-mono">
                      {p.name}: {p.pct}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Telemetry Grid Section (Right Column) */}
        <div className="lg:col-span-7 relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="bg-slate-950/90 border-2 border-slate-800 p-3 sm:p-4 text-white transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 hover:border-slate-500 shadow-[3px_3px_0px_0px_#000000] group relative overflow-hidden"
            >
              {/* Top Accent Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: p.color }}
              />

              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5"
                  style={{ color: p.color, backgroundColor: `${p.color}1A` }}
                >
                  {p.name}
                </span>
                {p.pct !== null && (
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {p.pct}%
                  </span>
                )}
              </div>

              <div className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-white mb-1">
                {p.count.toLocaleString()}
              </div>

              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                {p.tag}
              </div>

              {/* Fixed Mini Progress Bar (Accurate percentage width) */}
              {p.pct !== null && (
                <div className="w-full bg-slate-800 h-1.5 mt-2.5 overflow-hidden rounded-none border border-slate-700">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${p.pct}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
