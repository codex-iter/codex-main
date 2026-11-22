import React from "react";

export function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-end gap-2 border-b-2 border-slate-100 pb-1 last:border-0 last:pb-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none pb-0.5">
        {label}
      </span>
      <span className="text-sm font-black text-slate-900 leading-none text-right">
        {value}
      </span>
    </div>
  );
}

export function PlatformCard({
  platform,
  children,
  href,
}: {
  platform: string;
  children: React.ReactNode;
  href?: string | null;
}) {
  return (
    <div className="border-4 border-slate-900 bg-white p-5 flex flex-col brutalist-shadow-sm hover:-translate-y-1 hover:-translate-x-1 transition-transform">
      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 border-b-4 border-slate-900 pb-2 mb-4">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary inline-flex items-center gap-1 group">
            {platform}
            <span className="text-base font-normal transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </a>
        ) : (
          platform
        )}
      </h3>
      <div className="flex-1 flex flex-col gap-3 justify-center">
        {children}
      </div>
    </div>
  );
}
