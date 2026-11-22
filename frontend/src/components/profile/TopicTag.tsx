

export function TopicTag({ topic }: { topic: string }) {
  return (
    <div className="border-2 border-slate-900 bg-white brutalist-shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-default">
      <span className="block px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-900">
        {topic}
      </span>
    </div>
  );
}
