import { motion } from "framer-motion";

export function DiffBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs font-black uppercase tracking-widest text-slate-600 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-6 bg-slate-50 border-2 border-slate-900 overflow-hidden relative brutalist-shadow-sm">
        <motion.div
          className={`h-full ${color} border-r-2 border-slate-900 last:border-r-0`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="w-10 text-right text-sm md:text-base font-black text-slate-900 flex-shrink-0">
        {value}
      </span>
    </div>
  );
}

