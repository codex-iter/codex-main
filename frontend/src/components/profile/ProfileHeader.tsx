import { StaggerItem } from "../animations/ScrollReveal";
import type { MemberProfile } from "../../services/codexApi";
import AvatarImage from "../ui/AvatarImage";

export function ProfileHeader({ profile }: { profile: MemberProfile }) {
  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white brutalist-shadow flex flex-col overflow-hidden relative">
        {/* Top Tactical Status Bar */}
        <div className="bg-slate-950 text-white px-4 py-2.5 border-b-4 border-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-[#0707f2] text-white font-black px-2.5 py-0.5 text-[11px] uppercase tracking-wider border border-slate-900">
              CODEX MEMBER
            </span>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b8a3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00b8a3]"></span>
              </span>
              <span className="text-slate-300 font-mono text-[11px] uppercase">
                {profile.roll_number ? `ROLL: ${profile.roll_number}` : "VERIFIED_MEMBER"}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold hidden sm:block">
            [ SYS::MEMBER_PROFILE ]
          </div>
        </div>

        {/* Main Body with Dark Slate Brutalist Console */}
        <div className="bg-slate-900 p-6 md:p-8 text-white relative flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center">
          {/* Subtle Decorative Grid Pattern */}
          <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />

          {/* Profile Avatar Frame */}
          <div className="relative flex-shrink-0 z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-slate-900 bg-slate-800 overflow-hidden brutalist-shadow-sm relative group flex items-center justify-center font-black text-3xl sm:text-4xl text-white">
              <AvatarImage
                url={profile.avatar_url}
                handle={profile.github_handle || undefined}
                name={profile.full_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#FACC15] text-slate-900 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000000]">
              CODEX
            </div>
          </div>

          {/* Details & Social Actions */}
          <div className="flex-1 min-w-0 relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-[3px_3px_0px_#000000]">
              {profile.full_name}
            </h1>

            {profile.bio && (
              <p className="text-slate-300 font-mono text-xs sm:text-sm italic mb-4 max-w-xl border-l-2 border-[#FACC15] pl-3 py-0.5">
                "{profile.bio}"
              </p>
            )}

            {/* Social Links Bar */}
            <div className="flex flex-wrap gap-3 mt-4">
              {profile.github_handle && (
                <a
                  href={profile.github_url || `https://github.com/${profile.github_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-2 border-slate-900 bg-slate-800 hover:bg-[#0707f2] px-3.5 py-1.5 text-xs font-black text-white uppercase tracking-widest transition-all shadow-[3px_3px_0px_0px_#000000] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-base leading-none">code</span>
                  GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-2 border-slate-900 bg-slate-800 hover:bg-[#0077b5] px-3.5 py-1.5 text-xs font-black text-white uppercase tracking-widest transition-all shadow-[3px_3px_0px_0px_#000000] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-base leading-none">work</span>
                  LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-2 border-slate-900 bg-slate-800 hover:bg-[#00b8a3] px-3.5 py-1.5 text-xs font-black text-white uppercase tracking-widest transition-all shadow-[3px_3px_0px_0px_#000000] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-base leading-none">language</span>
                  Portfolio
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaggerItem>
  );
}
