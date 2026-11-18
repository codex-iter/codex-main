import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { LeaderboardMember } from "../../hooks/useLeaderboard";
import AvatarImage from "../ui/AvatarImage";

const RANK_STYLES: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-yellow-400",  text: "text-slate-900", border: "border-yellow-500" },
  2: { bg: "bg-slate-300",   text: "text-slate-900", border: "border-slate-400"  },
  3: { bg: "bg-amber-600",   text: "text-white",     border: "border-amber-700"  },
};

function rankStyle(rank: number) {
  return RANK_STYLES[rank] ?? { bg: "bg-white", text: "text-slate-900", border: "border-slate-900" };
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center border-2 border-slate-900 px-3 py-1 min-w-[64px]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none">
        {label}
      </span>
      <span className="text-base font-black text-slate-900 leading-tight">{value}</span>
    </div>
  );
}

export default function LeaderboardRow({
  member,
  rank,
}: {
  member: LeaderboardMember;
  rank: number;
}) {
  const rs = rankStyle(rank);
  const profileHref = member.handle
    ? `/profile/${member.handle}`
    : null;

  const inner = (
    <motion.div
      whileHover={{ x: 3, y: -3 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-4 bg-white border-4 border-slate-900 p-4 brutalist-shadow-hover transition-all duration-200 group cursor-pointer"
    >
      {/* Rank badge */}
      <div
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border-4 ${rs.border} ${rs.bg} font-black text-lg ${rs.text}`}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12 border-4 border-slate-900 overflow-hidden bg-slate-200 flex items-center justify-center font-black text-lg">
        <AvatarImage
          url={member.avatar_url}
          handle={member.handle}
          name={member.full_name}
        />
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-slate-900 uppercase tracking-tight truncate text-base md:text-lg leading-none">
          {member.full_name ?? "—"}
        </h3>
        {member.handle && (
          <span className="text-xs font-bold text-primary mt-0.5 inline-block">
            @{member.handle}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
        <StatPill label="Score"    value={member.total_score.toFixed(0)} />
        <StatPill label="LC"       value={member.leetcode_total} />
        <StatPill label="Contribs" value={member.total_contributions} />
        <StatPill label="Contests" value={member.contests_attended} />
      </div>

      {/* Mobile score */}
      <div className="sm:hidden flex flex-col items-end">
        <span className="text-xl font-black text-primary">{member.total_score.toFixed(0)}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">pts</span>
      </div>
    </motion.div>
  );

  return profileHref ? (
    <Link to={profileHref} className="block">{inner}</Link>
  ) : (
    inner
  );
}
