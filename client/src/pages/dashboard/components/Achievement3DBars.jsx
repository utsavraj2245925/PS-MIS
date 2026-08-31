import React from "react";

const PALETTE = ["#14b8a6", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const shade = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * percent);
  return rgbToHex(r + amt, g + amt, b + amt);
};
const mix = (hexA, hexB, t) => {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
};
const paletteColor = (fraction) => {
  const scaled = fraction * (PALETTE.length - 1);
  const i = Math.min(PALETTE.length - 2, Math.floor(scaled));
  const t = scaled - i;
  return mix(PALETTE[i], PALETTE[i + 1], t);
};

const BAR_WIDTH = 42;
const BAR_GAP = 22;
const DEPTH = 10;
const CHART_HEIGHT = 190;
const TOP_PAD = 40;
const BOTTOM_PAD = 22;

const Achievement3DBars = ({ data = [], valueKey = "achievement", suffix = "%", formatLabel }) => {
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const width = data.length * (BAR_WIDTH + BAR_GAP) + BAR_GAP + DEPTH;
  const height = TOP_PAD + CHART_HEIGHT + BOTTOM_PAD + DEPTH;
  const baseY = TOP_PAD + CHART_HEIGHT;

  return (
    <div className="w-full overflow-x-auto pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <svg width={Math.max(width, 260)} height={height} style={{ display: "block" }}>
        <line x1={DEPTH} y1={baseY} x2={width} y2={baseY} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0;
          const h = maxVal > 0 ? (val / maxVal) * CHART_HEIGHT : 0;
          const x0 = BAR_GAP + i * (BAR_WIDTH + BAR_GAP);
          const yTop = baseY - h;
          const base = paletteColor(data.length <= 1 ? 0 : i / (data.length - 1));
          const front = base;
          const top = shade(base, 22);
          const side = shade(base, -18);

          const frontPts = `${x0},${baseY} ${x0 + BAR_WIDTH},${baseY} ${x0 + BAR_WIDTH},${yTop} ${x0},${yTop}`;
          const topPts = `${x0},${yTop} ${x0 + BAR_WIDTH},${yTop} ${x0 + BAR_WIDTH + DEPTH},${yTop - DEPTH} ${x0 + DEPTH},${yTop - DEPTH}`;
          const sidePts = `${x0 + BAR_WIDTH},${baseY} ${x0 + BAR_WIDTH + DEPTH},${baseY - DEPTH} ${x0 + BAR_WIDTH + DEPTH},${yTop - DEPTH} ${x0 + BAR_WIDTH},${yTop}`;

          const apexX = x0 + BAR_WIDTH / 2 + DEPTH / 2;
          const apexY = yTop - DEPTH;
          const calloutY = Math.max(14, apexY - 26);
          const calloutText = `${val}${suffix}`;
          const calloutWidth = Math.max(32, calloutText.length * 6.5 + 12);

          return (
            <g key={d.date || i}>
              <polygon points={sidePts} fill={side} />
              <polygon points={frontPts} fill={front} />
              <polygon points={topPts} fill={top} />

              <line x1={apexX} y1={apexY} x2={apexX} y2={calloutY + 12} stroke="#94a3b8" strokeWidth={1} />
              <circle cx={apexX} cy={apexY} r={2.5} fill="#334155" />

              <rect
                x={apexX - calloutWidth / 2}
                y={calloutY - 11}
                width={calloutWidth}
                height={18}
                rx={5}
                fill={front}
              />
              <text x={apexX} y={calloutY + 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
                {calloutText}
              </text>

              <text
                x={x0 + BAR_WIDTH / 2}
                y={baseY + 15}
                textAnchor="middle"
                fontSize={9}
                fontStyle="italic"
                fontWeight={600}
                fill="#64748b"
              >
                {formatLabel ? formatLabel(d) : d.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Achievement3DBars;