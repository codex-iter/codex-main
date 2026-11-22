import { useState } from "react";
import { StaggerItem } from "../animations/ScrollReveal";
import type { DerivedStats } from "../../hooks/useMemberProfile";
import { Label, SectionTitle } from "./SharedStyles";

interface SkillSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  hoverColor: string;
  borderColor: string;
}

function getDonutPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startAngle: number,
  endAngle: number
) {
  // Angle difference check for full circle edge case
  const angleDiff = endAngle - startAngle;
  const effectiveEndAngle = angleDiff >= 360 ? startAngle + 359.99 : endAngle;

  const rad1 = ((startAngle - 90) * Math.PI) / 180;
  const rad2 = ((effectiveEndAngle - 90) * Math.PI) / 180;

  const x1Out = cx + rOut * Math.cos(rad1);
  const y1Out = cy + rOut * Math.sin(rad1);
  const x2Out = cx + rOut * Math.cos(rad2);
  const y2Out = cy + rOut * Math.sin(rad2);

  const x1In = cx + rIn * Math.cos(rad1);
  const y1In = cy + rIn * Math.sin(rad1);
  const x2In = cx + rIn * Math.cos(rad2);
  const y2In = cy + rIn * Math.sin(rad2);

  const largeArc = angleDiff > 180 ? 1 : 0;

  return `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1In} ${y1In} Z`;
}

export function SkillDistribution({ derived }: { derived: DerivedStats }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (derived.totalSkill === 0) return null;

  const segments: SkillSegment[] = [
    {
      key: "fundamentals",
      label: "Fundamentals",
      count: derived.skillFundamentals,
      color: "#facc15",
      hoverColor: "#fde047",
      borderColor: "#0f172a",
    },
    {
      key: "dsa",
      label: "DSA",
      count: derived.skillDsa,
      color: "#38bdf8",
      hoverColor: "#7dd3fc",
      borderColor: "#0f172a",
    },
    {
      key: "cp",
      label: "Competitive",
      count: derived.skillCp,
      color: "#ef4444",
      hoverColor: "#f87171",
      borderColor: "#0f172a",
    },
  ].filter((s) => s.count > 0);

  // Calculate angles for donut chart
  let currentAngle = 0;
  const chartSegments = segments.map((seg) => {
    const percentage = (seg.count / derived.totalSkill) * 100;
    const angleSpan = (seg.count / derived.totalSkill) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;

    return {
      ...seg,
      percentage,
      startAngle,
      endAngle,
      path: getDonutPath(120, 120, 95, 55, startAngle, endAngle),
    };
  });

  const activeSegment = chartSegments.find((s) => s.key === hoveredKey);

  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white p-6 md:p-8 brutalist-shadow">
        <div className="mb-6">
          <Label>Mastery</Label>
          <SectionTitle>Skill Distribution</SectionTitle>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8 my-4">
          {/* Circular Donut Chart */}
          <div className="relative w-60 h-60 md:w-72 md:h-72 flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 240 240"
              className="w-full h-full drop-shadow-[4px_4px_0px_#0f172a]"
            >
              {chartSegments.map((seg) => {
                const isHovered = hoveredKey === seg.key;
                return (
                  <path
                    key={seg.key}
                    d={seg.path}
                    fill={isHovered ? seg.hoverColor : seg.color}
                    stroke="#0f172a"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      transformOrigin: "120px 120px",
                      transform: isHovered ? "scale(1.04)" : "scale(1)",
                    }}
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })}
            </svg>

            {/* Central Information Block */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
              <div className="bg-white border-2 border-slate-900 px-3 py-1.5 brutalist-shadow-sm max-w-[140px] truncate">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-900 block truncate">
                  {activeSegment ? activeSegment.label : "Total Problems"}
                </span>
                <span className="text-sm md:text-lg font-black text-slate-900 block">
                  {activeSegment ? `${activeSegment.count} (${Math.round(activeSegment.percentage)}%)` : `${derived.totalSkill}`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend & Details Panel */}
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {chartSegments.map((seg) => {
              const isHovered = hoveredKey === seg.key;
              return (
                <div
                  key={seg.key}
                  onMouseEnter={() => setHoveredKey(seg.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`flex items-center justify-between gap-6 p-3 border-3 border-slate-900 transition-all cursor-pointer brutalist-shadow-sm ${
                    isHovered ? "bg-[#FACC15] -translate-y-1 shadow-[4px_4px_0px_0px_#0f172a]" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 border-2 border-slate-900 flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-900">
                        {seg.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        {seg.count} Problems Solved
                      </span>
                    </div>
                  </div>

                  <div className="text-right border-l-2 border-slate-900 pl-4">
                    <span className="text-sm md:text-base font-black text-slate-900">
                      {Math.round(seg.percentage)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StaggerItem>
  );
}

