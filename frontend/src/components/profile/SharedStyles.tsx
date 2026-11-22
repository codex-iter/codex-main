import React from "react";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-primary text-white px-3 py-0.5 font-bold uppercase tracking-widest text-[10px] border-2 border-slate-900">
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
      {children}
    </h2>
  );
}
