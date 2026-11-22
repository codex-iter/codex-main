import { StaggerItem } from "../animations/ScrollReveal";
import { Label, SectionTitle } from "./SharedStyles";

export function AchievementsAndBadges({ badges }: { badges: Array<{ platform: string, id: string, name: string, icon?: string }> }) {
  if (!badges) return null;
  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white p-6 md:p-8 brutalist-shadow">
        <div className="mb-6 flex justify-between items-end gap-4 flex-wrap">
          <div>
            <Label>Rewards</Label>
            <SectionTitle>Achievements & Badges</SectionTitle>
          </div>
        </div>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map((badge, idx) => (
              <div key={`${badge.platform}-${badge.id}-${idx}`} className="border-4 border-slate-900 bg-white p-4 flex flex-col items-center justify-center text-center brutalist-shadow-sm hover:-translate-y-1 transition-transform group">
                {badge.icon ? (
                  <img src={badge.icon} alt={badge.name} loading="lazy" className="w-16 h-16 object-contain mb-3 group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 border-2 border-slate-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-slate-400">workspace_premium</span>
                  </div>
                )}
                <span className="text-xs font-black uppercase tracking-tight text-slate-900 leading-tight mt-2">
                  {badge.name}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                  {badge.platform}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-4 border-slate-900 border-dashed p-8 text-center bg-slate-50">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">military_tech</span>
            <span className="text-sm font-black uppercase tracking-widest text-slate-400">
              No Badges Earned Yet
            </span>
          </div>
        )}
      </div>
    </StaggerItem>
  );
}
