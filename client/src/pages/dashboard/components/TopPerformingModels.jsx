import React, { useRef, useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

// ============================= color helpers =============================
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

const PALETTE = ["#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#0d9488", "#db2777", "#f59e0b", "#0ea5e9", "#ea580c", "#64748b"];

const niceMax = (val) => {
  if (val <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(val)));
  const n = val / pow;
  let step;
  if (n <= 1) step = 1;
  else if (n <= 2) step = 2;
  else if (n <= 5) step = 5;
  else step = 10;
  return step * pow;
};

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

// ============================= 3D horizontal bar chart =============================
const HorizontalBars3D = ({ data, valueKey, hoverFormatter }) => {
  const [containerRef, containerWidth] = useContainerWidth();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const n = data.length;
  const ROW_H = 28;
  const ROW_GAP = 18;
  const TOP_PAD = 6;
  const BOTTOM_PAD = 26;
  const LABEL_W = Math.min(96, Math.max(58, containerWidth * 0.2));
  const DEPTH = Math.max(9, Math.min(15, ROW_H * 0.4)); // bolder extrusion than before, always visible

  if (!containerWidth || n === 0) {
    return <div ref={containerRef} className="w-full" style={{ height: 200 }} />;
  }

  // VALUE_W is sized to the widest formatted value actually present in the
  // data — a "45,080"-length number reserves more room than a "26"-length
  // one, so the value text can NEVER spill past the card edge regardless
  // of how many digits the biggest bar's number has.
  const longestValueChars = Math.max(
    ...data.map((d) => (Number(d[valueKey]) || 0).toLocaleString().length),
    2
  );
  const VALUE_W = Math.min(84, Math.max(38, longestValueChars * 7.2 + 10));

  const plotWidth = Math.max(30, containerWidth - LABEL_W - VALUE_W - DEPTH - 4);
  const maxVal = niceMax(Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1) * 1.05);
  const chartAreaHeight = n * ROW_H + (n - 1) * ROW_GAP;
  const height = TOP_PAD + chartAreaHeight + BOTTOM_PAD + DEPTH;
  const width = containerWidth;

  const xScale = (v) => (v / maxVal) * plotWidth;
  const barsStartX = LABEL_W;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));
  const baseY = TOP_PAD + chartAreaHeight;

  const bars = data.map((d, i) => {
    const val = Number(d[valueKey]) || 0;
    const y0 = TOP_PAD + i * (ROW_H + ROW_GAP);
    const xEnd = barsStartX + xScale(val);
    return { ...d, val, y0, xEnd, color: PALETTE[i % PALETTE.length] };
  });

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null;
  const tooltipWidth = 168;
  let tipLeft = hovered ? mouse.x + 14 : 0;
  if (hovered && tipLeft + tooltipWidth > containerWidth) tipLeft = mouse.x - tooltipWidth - 14;
  const tipTop = hovered ? Math.max(0, mouse.y - 40) : 0;

  return (
    <div ref={containerRef} className="w-full relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {ticks.map((t) => (
          <line key={`grid-${t}`} x1={barsStartX + xScale(t)} y1={TOP_PAD} x2={barsStartX + xScale(t)} y2={baseY} stroke="#e2e8f0" strokeDasharray="3 3" />
        ))}
        <line x1={barsStartX} y1={baseY} x2={barsStartX} y2={TOP_PAD} stroke="#cbd5e1" strokeWidth={1} />

        {bars.map((b, i) => (
          <rect
            key={`hit-${b.modelId || i}`}
            x={0}
            y={b.y0}
            width={width}
            height={ROW_H}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => { setHoverIndex(i); const r = containerRef.current.getBoundingClientRect(); setMouse({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onMouseMove={(e) => { const r = containerRef.current.getBoundingClientRect(); setMouse({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}

        {/* 3D bars — bolder shading (top +34% lighter, end -34% darker)
            makes the extrusion unmistakable rather than a subtle sliver */}
        {bars.map((b, i) => {
          const front = b.color;
          const top = shade(b.color, 34);
          const end = shade(b.color, -34);
          const y1 = b.y0 + ROW_H;
          const dim = hoverIndex !== null && hoverIndex !== i;

          const frontPts = `${barsStartX},${b.y0} ${b.xEnd},${b.y0} ${b.xEnd},${y1} ${barsStartX},${y1}`;
          const topPts = `${barsStartX},${b.y0} ${b.xEnd},${b.y0} ${b.xEnd + DEPTH},${b.y0 - DEPTH} ${barsStartX + DEPTH},${b.y0 - DEPTH}`;
          const endPts = `${b.xEnd},${b.y0} ${b.xEnd + DEPTH},${b.y0 - DEPTH} ${b.xEnd + DEPTH},${y1 - DEPTH} ${b.xEnd},${y1}`;

          return (
            <g key={`bar-${b.modelId || i}`} style={{ opacity: dim ? 0.55 : 1, transition: "opacity 0.15s" }}>
              <polygon points={endPts} fill={end} stroke="#fff" strokeWidth={0.5} style={{ pointerEvents: "none" }} />
              <polygon points={frontPts} fill={front} style={{ pointerEvents: "none" }} />
              <polygon points={topPts} fill={top} stroke="#fff" strokeWidth={0.5} style={{ pointerEvents: "none" }} />

              <text
                x={barsStartX - 8}
                y={b.y0 + ROW_H / 2}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={600}
                fill="#475569"
                style={{ pointerEvents: "none" }}
              >
                {b.modelName}
              </text>

              <text
                x={Math.min(b.xEnd + DEPTH + 6, width - 2)}
                y={b.y0 + ROW_H / 2 - DEPTH / 2}
                dominantBaseline="central"
                fontSize={10}
                fontWeight={700}
                fill="#1e293b"
                style={{ pointerEvents: "none" }}
              >
                {b.val.toLocaleString()}
              </text>
            </g>
          );
        })}

        {ticks.map((t) => (
          <text key={`ticklbl-${t}`} x={barsStartX + xScale(t)} y={baseY + 15} textAnchor="middle" fontSize={9} fill="#64748b">
            {t.toLocaleString()}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg border shadow-lg bg-white px-3 py-1.5 text-[11px]"
          style={{ left: tipLeft, top: tipTop, borderColor: shade(hovered.color, -10), minWidth: tooltipWidth }}
        >
          <p className="font-bold text-slate-700 mb-0.5">{hovered.modelName}</p>
          <p style={{ color: hovered.color }} className="font-semibold">
            {hoverFormatter ? hoverFormatter(hovered.val) : `${hovered.val.toLocaleString()} units`}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================= main component =============================
const TopPerformingModels = () => {
  const { topModels, modelPartLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Trophy size={14} className="text-blue-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Top Performing Models</h3>
          <p className="text-[10px] text-slate-400">Production Volume · {rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !topModels?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <HorizontalBars3D
            data={topModels}
            valueKey="quantity"
            hoverFormatter={(v) => `${v.toLocaleString()} units`}
          />
        </div>
      )}
    </div>
  );
};

export default TopPerformingModels;