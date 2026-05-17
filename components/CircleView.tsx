"use client";

import { TimeBlock, blockColor, blockDisplayName, sectorLabelInfo, labelForSpan } from "@/components/CircleEditor";

const SVG_SIZE = 220;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const R = 82;
const INNER_R = 32;

function minToAngle(min: number) {
  return (min / 1440) * 360 - 90;
}

function polarToCart(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function describeSector(startMin: number, endMin: number, outerR: number, innerR: number) {
  let start = startMin;
  let end = endMin;
  if (end <= start) end += 1440;
  const startAngle = minToAngle(start);
  const endAngle = minToAngle(end);
  const os = polarToCart(startAngle, outerR);
  const oe = polarToCart(endAngle, outerR);
  const is = polarToCart(startAngle, innerR);
  const ie = polarToCart(endAngle, innerR);
  const largeArc = end - start > 720 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${is.x} ${is.y}`,
    "Z",
  ].join(" ");
}

import type { CircleThemeVars } from "@/components/CircleEditor";

interface CircleViewProps {
  blocks: TimeBlock[];
  overlapBlocks?: { startMin: number; endMin: number }[];
  label?: string;
  size?: number;
  theme?: CircleThemeVars;
}

export default function CircleView({ blocks, overlapBlocks, label, theme }: CircleViewProps) {
  const hourTicks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full max-w-[220px]"
        style={theme ? {
          "--circle-bg": theme.bg, "--circle-inner": theme.inner, "--circle-stroke": theme.stroke,
          "--circle-tick-major": theme.tickMajor, "--circle-tick-minor": theme.tickMinor,
        } as React.CSSProperties : undefined}>
        <circle cx={CX} cy={CY} r={R} fill="var(--circle-bg, #1e1e2e)" stroke="var(--circle-stroke, #333)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={INNER_R} fill="var(--circle-inner, #12121f)" />

        {hourTicks.map((h) => {
          const angle = (h / 24) * 360 - 90;
          const inner = polarToCart(angle, INNER_R + 3);
          const outer = polarToCart(angle, R - 3);
          return (
            <line
              key={h}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke={h % 6 === 0 ? "var(--circle-tick-major, #444)" : "var(--circle-tick-minor, #2a2a2a)"}
              strokeWidth={h % 6 === 0 ? 1.2 : 0.6}
            />
          );
        })}

        {blocks.map((b, i) => {
          const name = blockDisplayName(b);
          const info = sectorLabelInfo(b.startMin, b.endMin, R, INNER_R, CX, CY);
          const labelText = labelForSpan(name, info.span);
          return (
            <g key={i}>
              <path
                d={describeSector(b.startMin, b.endMin, R, INNER_R)}
                fill={blockColor(b)}
                opacity="0.9"
                stroke="var(--circle-bg, #1e1e2e)"
                strokeWidth="0.8"
              />
              {labelText && (
                <text
                  x={info.x} y={info.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" fontWeight="700"
                  fill="rgba(255,255,255,0.95)"
                  transform={`rotate(${info.rotate}, ${info.x}, ${info.y})`}
                  style={{ filter: "drop-shadow(0 0 1.5px rgba(0,0,0,0.8))", pointerEvents: "none" }}
                >
                  {labelText}
                </text>
              )}
            </g>
          );
        })}

        {overlapBlocks?.map((b, i) => (
          <path
            key={`ov-${i}`}
            d={describeSector(b.startMin, b.endMin, R, INNER_R)}
            fill="#22C55E"
            opacity="0.5"
            stroke="#22C55E"
            strokeWidth="1"
          />
        ))}

        {label && (
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize="9" fill="#aaa">
            {label}
          </text>
        )}
      </svg>
      {label && (
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      )}
    </div>
  );
}
