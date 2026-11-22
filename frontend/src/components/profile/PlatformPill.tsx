

export function PlatformPill({
  platform,
  value,
  unit,
}: {
  platform: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col border-4 border-slate-900 px-4 py-3 bg-white brutalist-shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">
        {platform}
      </span>
      <span className="text-2xl font-black text-slate-900 leading-tight">
        {value}
        {unit && (
          <span className="text-sm text-slate-400 font-bold ml-1">{unit}</span>
        )}
      </span>
    </div>
  );
}
