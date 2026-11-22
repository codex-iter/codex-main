
import { motion } from "framer-motion";

export function MetricCard({
  label,
  value,
  accent = false,
  unit,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  unit?: string;
}) {
  return (
    <motion.div
      whileHover={{ x: -3, y: -3 }}
      transition={{ duration: 0.15 }}
      className="bg-white border-4 border-slate-900 p-5 brutalist-shadow flex flex-col justify-between min-h-[110px]"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="flex items-end gap-1 mt-2">
        <span
          className={`text-4xl font-black leading-none ${
            accent ? "text-primary" : "text-slate-900"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-bold text-slate-400 pb-1">{unit}</span>
        )}
      </div>
    </motion.div>
  );
}
