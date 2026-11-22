import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { LeaderboardMember } from "../../hooks/useLeaderboard";
import AvatarImage from "../ui/AvatarImage";

interface LeaderboardPodiumProps {
  members: LeaderboardMember[];
  sortMode?: 'GLOBAL' | 'DSA' | 'DEV';
}

export default function LeaderboardPodium({ members, sortMode = 'GLOBAL' }: LeaderboardPodiumProps) {
  const top3 = members.slice(0, 3);
  if (top3.length === 0) return null;

  // Podium Display Order: Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)
  const podiumOrder = [
    { member: top3[1] || null, rank: 2, key: "rank-2" },
    { member: top3[0] || null, rank: 1, key: "rank-1" },
    { member: top3[2] || null, rank: 3, key: "rank-3" },
  ];

  const cuboidConfig = {
    1: {
      // GOLD
      height: "h-56 md:h-64",
      topBg: "bg-gradient-to-r from-yellow-300 via-[#FACC15] to-amber-400",
      frontBg: "bg-white",
      borderColor: "border-slate-900",
      accentBg: "bg-[#FACC15]",
      accentTextColor: "text-slate-900",
      badgeColor: "bg-[#FACC15] text-slate-900 border-2 border-slate-900",
      trophyIcon: "🏆",
      crown: "👑",
      rankLabel: "1ST PLACE",
      shadow: "shadow-[6px_6px_0px_0px_#0f172a]",
      glowRing: "ring-4 ring-[#FACC15]/50",
    },
    2: {
      // SILVER
      height: "h-48 md:h-56",
      topBg: "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400",
      frontBg: "bg-white",
      borderColor: "border-slate-900",
      accentBg: "bg-slate-300",
      accentTextColor: "text-slate-900",
      badgeColor: "bg-slate-300 text-slate-900 border-2 border-slate-900",
      trophyIcon: "🥈",
      crown: null,
      rankLabel: "2ND PLACE",
      shadow: "shadow-[5px_5px_0px_0px_#0f172a]",
      glowRing: "ring-4 ring-slate-300/50",
    },
    3: {
      // BRONZE
      height: "h-44 md:h-52",
      topBg: "bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800",
      frontBg: "bg-white",
      borderColor: "border-slate-900",
      accentBg: "bg-amber-600",
      accentTextColor: "text-white",
      badgeColor: "bg-amber-600 text-white border-2 border-slate-900",
      trophyIcon: "🥉",
      crown: null,
      rankLabel: "3RD PLACE",
      shadow: "shadow-[4px_4px_0px_0px_#0f172a]",
      glowRing: "ring-4 ring-amber-600/50",
    },
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto pt-10 sm:pt-16 pb-8 sm:pb-12 flex justify-center items-end gap-1.5 sm:gap-6 md:gap-8 px-0 sm:px-4 md:px-6 z-20">
      {podiumOrder.map(({ member, rank }) => {
        if (!member) return <div key={rank} className="w-1/3 max-w-[260px] opacity-0" />;

        const config = cuboidConfig[rank as 1 | 2 | 3];
        const isRank1 = rank === 1;
        const profileHref = member.handle ? `/profile/${member.handle}` : "#";

        const displayScore = sortMode === 'DSA' ? member.dsa_score : sortMode === 'DEV' ? member.dev_score : member.total_score;
        const displayMetric = sortMode === 'DEV' ? member.total_contributions : member.total_solved;

        return (
          <Link
            key={member.id}
            to={profileHref}
            className="relative flex flex-col items-center w-[32%] sm:w-1/3 max-w-[260px] group outline-none cursor-pointer"
            style={{ zIndex: isRank1 ? 30 : 20 - rank }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: "easeOut", duration: 0.5, delay: rank === 1 ? 0 : rank === 2 ? 0.15 : 0.3 }}
              className="w-full flex flex-col items-center relative"
            >
              {/* ── Hover Scorecard Tooltip (Matches exact user image spec) ── */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none scale-95 group-hover:scale-100 transition-all duration-200 z-[999] bg-white border-4 border-slate-900 brutalist-shadow flex-col p-4 w-72 text-left hidden sm:flex">
                <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2 mb-2">
                  <div className="w-10 h-10 border-2 border-slate-900 bg-slate-100 flex items-center justify-center font-black text-slate-900 overflow-hidden flex-shrink-0">
                    <AvatarImage url={member.avatar_url} handle={member.handle} name={member.full_name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-slate-900 truncate leading-tight">{member.full_name || member.handle}</div>
                    <div className="text-slate-500 font-bold text-xs truncate leading-tight mt-0.5">@{member.handle}</div>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-none bg-slate-900 text-white font-black flex items-center justify-center text-sm">
                    #{member.rank}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-800 font-bold">
                  <div className="flex items-center justify-between bg-slate-100 p-1.5 border-2 border-slate-900">
                    <span>XP</span>
                    <span className="text-slate-900 font-black">{displayScore.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-100 p-1.5 border-2 border-slate-900">
                    <span>Questions</span>
                    <span className="text-slate-900 font-black">{member.total_solved}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-100 p-1.5 border-2 border-slate-900 col-span-2">
                    <span>Contributions</span>
                    <span className="text-slate-900 font-black">{member.total_contributions}</span>
                  </div>
                </div>
              </div>

              {/* ── Floating Avatar Assembly ── */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: rank * 0.4 }}
                className="relative flex flex-col items-center mb-2 sm:mb-3 z-30 transition-transform duration-300 group-hover:-translate-y-4"
              >
                {/* Crown for Rank 1 */}
                {config.crown && (
                  <div className="text-2xl sm:text-4xl md:text-5xl -mb-1 sm:-mb-2 z-40 animate-bounce drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                    {config.crown}
                  </div>
                )}

                {/* Avatar Ring */}
                <div
                  className={`w-14 h-14 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 sm:border-4 border-slate-900 bg-white p-0.5 sm:p-1 relative z-10 ${config.shadow} transition-all duration-300 group-hover:scale-105 ${config.glowRing}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border sm:border-2 border-slate-900 flex items-center justify-center relative font-black text-xl sm:text-4xl md:text-5xl text-slate-900">
                    <AvatarImage url={member.avatar_url} handle={member.handle} name={member.full_name} />
                  </div>
                </div>

                {/* Member Name Badge Floating */}
                <div className="mt-1.5 sm:mt-2.5 bg-white text-slate-900 border-2 border-slate-900 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-center truncate max-w-[90px] sm:max-w-[170px] brutalist-shadow-sm group-hover:bg-[#FACC15] transition-colors">
                  {member.full_name || member.handle}
                </div>
              </motion.div>

              {/* ── 3D Cuboid Podium Block (White Theme + Metallic Top) ── */}
              <div className="w-full relative flex flex-col items-center group">
                {/* 3D Top Perspective Face (Beveled Roof) */}
                <div
                  className={`w-full h-5 sm:h-8 md:h-9 ${config.topBg} border-t-2 sm:border-t-4 border-l-2 sm:border-l-4 border-r-2 sm:border-r-4 border-slate-900 relative z-20`}
                  style={{
                    clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
                  }}
                >
                  <div className="w-full h-full bg-white/30" />
                </div>

                {/* 3D Front Face (White Main Body) */}
                <div
                  className={`w-full ${config.height} ${config.frontBg} border-b-2 sm:border-b-4 border-l-2 sm:border-l-4 border-r-2 sm:border-r-4 border-slate-900 p-1.5 sm:p-3 md:p-4 flex flex-col items-center justify-between text-slate-900 relative z-10 ${config.shadow}`}
                >
                  {/* Subtle Diagonal Stripe Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2" style={{ backgroundColor: rank === 1 ? "#FACC15" : rank === 2 ? "#94A3B8" : "#D97706" }} />

                  {/* Trophy Badge */}
                  <div
                    className={`w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 ${config.badgeColor} font-black text-xs sm:text-lg md:text-xl flex items-center justify-center brutalist-shadow-sm mt-0.5 sm:mt-1 relative z-10 flex-shrink-0`}
                  >
                    {config.trophyIcon}
                  </div>

                  {/* Rank Title Label */}
                  <div
                    className="text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest px-1 sm:px-2 py-0.5 border border-slate-900 mt-0.5 sm:mt-1 brutalist-shadow-sm truncate max-w-full text-center flex-shrink-0"
                    style={{ backgroundColor: rank === 1 ? "#FACC15" : rank === 2 ? "#E2E8F0" : "#F59E0B", color: rank === 3 ? "#000000" : "#0f172a" }}
                  >
                    {config.rankLabel}
                  </div>

                  {/* Middle XP / Score Display */}
                  <div className="text-center my-1 sm:my-auto z-10 w-full px-0.5">
                    <div className="text-[8px] sm:text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-0.5">
                      {sortMode} XP
                    </div>
                    <div className="text-xs sm:text-xl md:text-3xl font-black leading-none tracking-tight text-slate-900">
                      {displayScore.toLocaleString()}
                    </div>
                  </div>

                  {/* Bottom Stats Badge inside 3D Block */}
                  <div className="w-full bg-slate-100 border sm:border-2 border-slate-900 p-1 sm:p-1.5 text-center text-[8px] sm:text-[10px] font-mono font-bold text-slate-900 flex justify-around gap-0.5 sm:gap-1 z-10 brutalist-shadow-sm">
                    <span>⚡ {displayMetric}</span>
                    {sortMode === 'GLOBAL' && (
                      <span className="text-blue-700 font-bold">💻 {member.total_contributions} commits</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
