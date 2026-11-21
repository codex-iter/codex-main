import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ActivityCalendar, type ThemeInput } from "react-activity-calendar";
import { getClubActivityMap, getClubGithubHeatmap, type ActivityDay } from "../services/codexApi";

// ── Theme ─────────────────────────────────────────────────────────────────
// Matches the CODEX design palette: #CAF0F8 background, #0707f2 primary

const CODEX_THEME: ThemeInput = {
  light: ["#e2f0fb", "#90d4f0", "#48b4e0", "#0a7bbf", "#0707f2"],
  dark:  ["#1a1a2e", "#1a3a6e", "#0d5ea6", "#0a7bbf", "#0707f2"],
};

const GITHUB_THEME: ThemeInput = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark:  ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

// ── Skeleton ──────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="w-full h-36 bg-slate-200 animate-pulse border-4 border-slate-200" />
  );
}

// ── Error state ───────────────────────────────────────────────────────────

function CalendarError({ message }: { message: string }) {
  return (
    <div className="border-4 border-red-500 bg-white p-8 text-center brutalist-shadow">
      <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">
        error
      </span>
      <p className="text-sm font-bold uppercase tracking-widest text-red-600">
        {message}
      </p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function CalendarEmpty() {
  return (
    <div className="border-4 border-slate-900 bg-white p-10 text-center brutalist-shadow">
      <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">
        calendar_month
      </span>
      <h3 className="text-lg font-black uppercase text-slate-900 mb-1">
        No Activity Yet
      </h3>
      <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
        The club's combined activity will appear here once the first sync runs.
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function ClubActivityCalendar() {
  const [days, setDays] = useState<ActivityDay[]>([]);
  const [ghDays, setGhDays] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; activity: ActivityDay; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, ghData] = await Promise.all([
          getClubActivityMap(),
          getClubGithubHeatmap()
        ]);
        if (!cancelled) {
          setDays(data);
          setGhDays(ghData);
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const totalActions = days.reduce((sum, d) => sum + d.count, 0);
  const activeDays   = days.filter((d) => d.count > 0).length;

  return (
    <section className="bg-white border-4 border-slate-900 p-6 md:p-10 brutalist-shadow relative">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-block bg-primary text-white px-3 py-0.5 mb-3 font-bold uppercase tracking-widest text-[10px] border-2 border-slate-900">
            Club Overview
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase leading-none tracking-tighter">
            Collective{" "}
            <span className="text-slate-500">CODEX</span>{" "}
            Activity
          </h2>
        </div>

        {/* ── Summary stats ── */}
        {!loading && !error && days.length > 0 && (
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center border-4 border-slate-900 bg-slate-50 px-4 py-2 min-w-[80px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-1">
                Total Output
              </span>
              <span className="text-2xl font-black text-slate-900 leading-tight">
                {totalActions.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center border-4 border-slate-900 bg-slate-50 px-4 py-2 min-w-[80px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-1">
                Active Days
              </span>
              <span className="text-2xl font-black text-slate-700 leading-tight">
                {activeDays}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Calendar ── */}
      <div className="w-full overflow-x-auto pb-2 relative">
        {loading && <CalendarSkeleton />}

        {!loading && error && <CalendarError message={error} />}

        {!loading && !error && days.length === 0 && <CalendarEmpty />}

        {!loading && !error && days.length > 0 && (
          <div className="flex flex-col gap-10">
            <div>
              <h3 className="text-xl font-black uppercase text-slate-900 mb-4 tracking-tight border-l-4 border-primary pl-3">
                Problem Solving
              </h3>
              <ActivityCalendar
                data={[...days].reverse()}
                theme={CODEX_THEME}
                colorScheme="light"
                blockSize={14}
                blockMargin={4}
                blockRadius={2}
                fontSize={12}
                labels={{
                  legend: { less: "Less", more: "More" },
                  totalCount: "{{count}} problems in {{year}}",
                }}
                style={{
                  color: "#64748b",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                showWeekdayLabels
                renderBlock={(block, activity) =>
                  React.cloneElement(block as React.ReactElement<React.HTMLAttributes<SVGElement>>, {
                    onMouseEnter: (e: React.MouseEvent) => {
                      const rect = (e.target as Element).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        activity: activity as ActivityDay,
                        label: "PROBLEMS"
                      });
                    },
                    onMouseLeave: () => setTooltip(null),
                    className: "transition-all duration-150 hover:scale-150 hover:-translate-y-1 hover:z-20 cursor-crosshair",
                    style: { transformBox: 'fill-box', transformOrigin: 'center' }
                  })
                }
              />
            </div>

            <div>
              <h3 className="text-xl font-black uppercase text-slate-900 mb-4 tracking-tight border-l-4 border-[#39d353] pl-3">
                Club GitHub Commits
              </h3>
              <ActivityCalendar
                data={ghDays.length > 0 ? [...ghDays].reverse() : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 }]}
                theme={GITHUB_THEME}
                colorScheme="light"
                blockSize={14}
                blockMargin={4}
                blockRadius={2}
                fontSize={12}
                labels={{
                  legend: { less: "Less", more: "More" },
                  totalCount: "{{count}} commits in {{year}}",
                }}
                style={{
                  color: "#64748b",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                showWeekdayLabels
                renderBlock={(block, activity) =>
                  React.cloneElement(block as React.ReactElement<React.HTMLAttributes<SVGElement>>, {
                    onMouseEnter: (e: React.MouseEvent) => {
                      const rect = (e.target as Element).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        activity: activity as ActivityDay,
                        label: "COMMITS"
                      });
                    },
                    onMouseLeave: () => setTooltip(null),
                    className: "transition-all duration-150 hover:scale-150 hover:-translate-y-1 hover:z-20 cursor-crosshair",
                    style: { transformBox: 'fill-box', transformOrigin: 'center' }
                  })
                }
              />
            </div>



            {/* Tooltip Portal */}
            {tooltip && createPortal(
              <div
                className="fixed z-[100] pointer-events-none -translate-x-1/2 -translate-y-[120%]"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <div className="bg-slate-900 text-white font-mono uppercase text-xs tracking-wider border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-3 py-2 z-50 flex flex-col items-center text-center whitespace-nowrap">
                  <span className="border-b-2 border-slate-700 pb-1 mb-1 w-full text-slate-400">
                    {new Date(tooltip.activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  </span>
                  <span className="font-bold">
                    {tooltip.activity.count} {tooltip.label}
                  </span>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>

      {/* ── Footer legend ── */}
      {!loading && !error && days.length > 0 && (
        <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 border-t border-white/10 pt-4">
          Aggregated daily output across all club members · synced automatically
        </p>
      )}
    </section>
  );
}
