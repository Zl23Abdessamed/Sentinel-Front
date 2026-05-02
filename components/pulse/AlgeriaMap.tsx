"use client";

import { cn } from "@/lib/utils";

// Simplified Algeria silhouette + animated wilaya blips. Severity colors per
// design system. Cluster propagation lines (animated stroke-dashoffset) tie
// the origin (Alger) to the satellite wilayas it spread to.

export interface Wilaya {
  name: string;
  x: number;
  y: number;
  /** P1 / P2 / P3 / P4 — drives blip color + size */
  severity: "P1" | "P2" | "P3" | "P4";
  count: number;
  origin?: boolean;
}

interface AlgeriaMapProps {
  wilayas: Wilaya[];
  className?: string;
}

const COLOR: Record<Wilaya["severity"], string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#eab308",
  P4: "#3b82f6",
};

const RADIUS: Record<Wilaya["severity"], number> = {
  P1: 5,
  P2: 4,
  P3: 3,
  P4: 2.5,
};

const PULSE_SCALE: Record<Wilaya["severity"], number> = {
  P1: 6,
  P2: 4.5,
  P3: 3.5,
  P4: 3,
};

export function AlgeriaMap({ wilayas, className }: AlgeriaMapProps) {
  const origin = wilayas.find((w) => w.origin);
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-mono-12 uppercase text-text-muted tracking-wider">
          Carte nationale · 48 wilayas
        </div>
        <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
          Source : SENTINEL.DZ · k-anonyme ≥ 50
        </div>
      </div>
      <svg
        viewBox="0 0 600 240"
        className="w-full h-auto"
        role="img"
        aria-label="Carte de l'Algérie avec les wilayas affectées"
      >
        {/* Algeria silhouette — simplified outline */}
        <path
          d="M 100,80 L 200,60 L 290,55 L 380,60 L 460,75 L 520,95 L 540,140 L 510,180 L 450,200 L 380,205 L 320,200 L 260,185 L 200,165 L 160,140 L 130,115 L 110,95 Z"
          fill="#161b35"
          stroke="#2a3460"
          strokeWidth="1"
        />

        {/* Cluster propagation: dashed lines from origin */}
        {origin &&
          wilayas
            .filter((w) => !w.origin && (w.severity === "P1" || w.severity === "P2"))
            .map((w, i) => (
              <line
                key={`line-${i}`}
                x1={origin.x}
                y1={origin.y}
                x2={w.x}
                y2={w.y}
                stroke="#ef4444"
                strokeWidth="0.8"
                strokeDasharray="3 2"
                opacity="0.5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-14"
                  dur={`${0.8 + (i % 3) * 0.1}s`}
                  repeatCount="indefinite"
                />
              </line>
            ))}

        {/* Wilaya blips */}
        {wilayas.map((w) => (
          <g key={w.name}>
            {/* outer pulsing halo */}
            <circle
              cx={w.x}
              cy={w.y}
              r={RADIUS[w.severity]}
              fill={COLOR[w.severity]}
              opacity="0.3"
            >
              <animate
                attributeName="r"
                values={`${RADIUS[w.severity]};${PULSE_SCALE[w.severity] * 2};${RADIUS[w.severity]}`}
                dur={`${2.5 + (w.x % 5) * 0.15}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur={`${2.5 + (w.x % 5) * 0.15}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* solid core */}
            <circle
              cx={w.x}
              cy={w.y}
              r={RADIUS[w.severity]}
              fill={COLOR[w.severity]}
            />
            {/* name label */}
            <text
              x={w.x}
              y={w.y - RADIUS[w.severity] - 4}
              fontFamily="JetBrains Mono"
              fontSize="8"
              textAnchor="middle"
              fill="#9ca3af"
              opacity="0.85"
            >
              {w.name}
            </text>
            {/* count label (only for P1/P2) */}
            {(w.severity === "P1" || w.severity === "P2") && (
              <text
                x={w.x}
                y={w.y + RADIUS[w.severity] + 9}
                fontFamily="JetBrains Mono"
                fontSize="8"
                textAnchor="middle"
                fill={COLOR[w.severity]}
                fontWeight="700"
              >
                {w.count}
              </text>
            )}
          </g>
        ))}

        {/* Legend bottom-left */}
        <g transform="translate(20, 215)">
          <text fontFamily="JetBrains Mono" fontSize="8" fill="#6b7280" letterSpacing="0.05em">
            <tspan fill="#ef4444">●</tspan> <tspan fill="#9ca3af">P1</tspan>
            <tspan dx="10" fill="#f97316">●</tspan> <tspan fill="#9ca3af">P2</tspan>
            <tspan dx="10" fill="#eab308">●</tspan> <tspan fill="#9ca3af">P3</tspan>
            <tspan dx="10" fill="#3b82f6">●</tspan> <tspan fill="#9ca3af">P4</tspan>
          </text>
        </g>
      </svg>
    </div>
  );
}
