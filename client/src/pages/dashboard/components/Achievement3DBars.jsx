import React, { useRef, useState, useEffect } from "react";

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

// Tightened to match the original ResponsiveContainer height=220 chart's
// footprint exactly — no scroll, so this budget is final, not a fallback.
const CHART_HEIGHT = 130;
const TOP_PAD = 22;
const BOTTOM_PAD = 18;
const MIN_BAR_WIDTH = 3;
const MAX_BAR_WIDTH = 40;
const GAP_RATIO = 0.4;

const useContainerWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};

const Achievement3DBars = ({ data = [], valueKey = "achievement", suffix = "%", formatLabel }) => {
  const [containerRef, containerWidth] = useContainerWidth();
  const n = data.length;
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  if (!containerWidth || n === 0) {
    return <div ref={containerRef} className="w-full" style={{ height: TOP_PAD + CHART_HEIGHT + BOTTOM_PAD }} />;
  }

  // Bar width is solved so exactly n bars + gaps fill the container —
  // NEVER scrolls, regardless of how many days are in range. This is
  // what removes the scrollbar (and the "wrong default position" issue
  // that came with it) entirely, not just resizes it.
  const availablePx = containerWidth - 4;
  let barWidth = availablePx / (n * (1 + GAP_RATIO) - GAP_RATIO + 0.001);
  barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, barWidth));
  const gap = barWidth * GAP_RATIO;
  const rowWidth = n * barWidth + (n - 1) * gap;
  const startX = Math.max(0, (containerWidth - rowWidth) / 2);

  const depth = Math.max(2, Math.min(8, barWidth * 0.2));
  const width = containerWidth;
  const height = TOP_PAD + CHART_HEIGHT + BOTTOM_PAD + depth;
  const baseY = TOP_PAD + CHART_HEIGHT;

  const showCallouts = barWidth >= 20;
  const minLabelSpacing = 34;
  const maxLabelsFit = Math.max(1, Math.floor(rowWidth / minLabelSpacing));
  const labelStep = Math.max(1, Math.ceil(n / maxLabelsFit));

  return (
    <div ref={containerRef} className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <line x1={0} y1={baseY} x2={width} y2={baseY} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0;
          const h = maxVal > 0 ? (val / maxVal) * CHART_HEIGHT : 0;
          const x0 = startX + i * (barWidth + gap);
          const yTop = baseY - h;
          const base = n <= 1 ? PALETTE[0] : paletteColor(i / (n - 1));
          const front = base;
          const top = shade(base, 22);
          const side = shade(base, -18);

          const frontPts = `${x0},${baseY} ${x0 + barWidth},${baseY} ${x0 + barWidth},${yTop} ${x0},${yTop}`;
          const topPts = `${x0},${yTop} ${x0 + barWidth},${yTop} ${x0 + barWidth + depth},${yTop - depth} ${x0 + depth},${yTop - depth}`;
          const sidePts = `${x0 + barWidth},${baseY} ${x0 + barWidth + depth},${baseY - depth} ${x0 + barWidth + depth},${yTop - depth} ${x0 + barWidth},${yTop}`;

          const apexX = x0 + barWidth / 2 + depth / 2;
          const apexY = yTop - depth;
          const calloutText = `${val}${suffix}`;
          const calloutWidth = Math.max(26, calloutText.length * 5.5 + 8);
          const showLabel = i === 0 || i === n - 1 || i % labelStep === 0;

          return (
            <g key={d.date || i}>
              <title>{`${formatLabel ? formatLabel(d) : d.date}: ${calloutText}`}</title>
              <polygon points={sidePts} fill={side} />
              <polygon points={frontPts} fill={front} />
              <polygon points={topPts} fill={top} />

              {showCallouts && (
                <>
                  <line x1={apexX} y1={apexY} x2={apexX} y2={Math.max(8, apexY - 12)} stroke="#94a3b8" strokeWidth={1} />
                  <circle cx={apexX} cy={apexY} r={2} fill="#334155" />
                  <rect
                    x={apexX - calloutWidth / 2}
                    y={Math.max(0, apexY - 22)}
                    width={calloutWidth}
                    height={14}
                    rx={4}
                    fill={front}
                  />
                  <text x={apexX} y={Math.max(0, apexY - 22) + 10} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
                    {calloutText}
                  </text>
                </>
              )}

              {showLabel && (
                <text
                  x={x0 + barWidth / 2}
                  y={baseY + 13}
                  textAnchor="middle"
                  fontSize={8}
                  fontStyle="italic"
                  fontWeight={600}
                  fill="#64748b"
                >
                  {formatLabel ? formatLabel(d) : d.date}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Achievement3DBars;