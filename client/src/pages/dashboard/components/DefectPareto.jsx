import React, { useRef, useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

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

const PALETTE = ["#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#0d9488", "#db2777", "#f59e0b", "#64748b", "#0ea5e9", "#ea580c"];

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

// ============================= responsive width hook =============================
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

// ============================= 3D pareto chart =============================
const Pareto3D = ({ data }) => {
  const [containerRef, containerWidth] = useContainerWidth();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const n = data.length;
  const CHART_HEIGHT = 200;
  const TOP_PAD = 18;
  const BOTTOM_PAD = 56;
  const LEFT_PAD = 4;
  const RIGHT_PAD = 4;

  if (!containerWidth || n === 0) {
    return <div ref={containerRef} className="w-full" style={{ height: TOP_PAD + CHART_HEIGHT + BOTTOM_PAD }} />;
  }

  const plotWidth = containerWidth - LEFT_PAD - RIGHT_PAD;
  const qtyMax = niceMax(Math.max(...data.map((d) => d.quantity), 1) * 1.12);
  const baseY = TOP_PAD + CHART_HEIGHT;

  const slotWidth = plotWidth / n;
  const barWidth = Math.min(60, slotWidth * 0.5);
  const depth = Math.max(4, Math.min(14, barWidth * 0.28));

  const yForQty = (q) => baseY - (q / qtyMax) * CHART_HEIGHT;
  const yForPct = (p) => baseY - (Math.min(p, 100) / 100) * CHART_HEIGHT;

  const bars = data.map((d, i) => {
    const slotStart = LEFT_PAD + i * slotWidth;
    const x0 = slotStart + (slotWidth - barWidth) / 2;
    const color = PALETTE[i % PALETTE.length];
    return {
      ...d,
      x0,
      xMid: slotStart + slotWidth / 2,
      yTop: yForQty(d.quantity),
      color,
    };
  });

  const linePoints = bars.map((b) => ({ x: b.xMid, y: yForPct(b.cumulativePercent) }));
  const linePath = linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const qtyTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(qtyMax * f));
  const pctTicks = [0, 25, 50, 75, 100];

  const ref80Y = yForPct(80);

  const width = containerWidth;
  const height = TOP_PAD + CHART_HEIGHT + BOTTOM_PAD + depth;

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null;
  const tooltipWidth = 172;
  let tipLeft = hovered ? mouse.x + 14 : 0;
  if (hovered && tipLeft + tooltipWidth > containerWidth) tipLeft = mouse.x - tooltipWidth - 14;
  const tipTop = 6;

  return (
    <div ref={containerRef} className="w-full relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {/* horizontal gridlines, keyed off the quantity scale */}
        {qtyTicks.map((t) => (
          <line key={`grid-${t}`} x1={LEFT_PAD} y1={yForQty(t)} x2={width - RIGHT_PAD} y2={yForQty(t)} stroke="#e2e8f0" strokeDasharray="3 3" />
        ))}

        {/* 80% reference line */}
        <line x1={LEFT_PAD} y1={ref80Y} x2={width - RIGHT_PAD} y2={ref80Y} stroke="#dc2626" strokeDasharray="5 4" strokeWidth={1} />
        <text x={width - RIGHT_PAD} y={ref80Y - 4} textAnchor="end" fontSize={9} fill="#dc2626" fontWeight={600}>80%</text>

        {/* left axis (quantity) labels */}
        {qtyTicks.map((t) => (
          <text key={`qty-${t}`} x={LEFT_PAD} y={yForQty(t) - 3} fontSize={9} fill="#64748b">{t}</text>
        ))}
        {/* right axis (percent) labels */}
        {pctTicks.map((t) => (
          <text key={`pct-${t}`} x={width - RIGHT_PAD} y={yForPct(t) - 3} textAnchor="end" fontSize={9} fill="#64748b">{t}%</text>
        ))}

        <line x1={LEFT_PAD} y1={baseY} x2={width - RIGHT_PAD} y2={baseY} stroke="#cbd5e1" strokeWidth={1} />

        {/* hover column guide + invisible hit target, spans full plot height */}
        {bars.map((b, i) => (
          <rect
            key={`hit-${b.defectId || i}`}
            x={LEFT_PAD + i * slotWidth}
            y={TOP_PAD}
            width={slotWidth}
            height={CHART_HEIGHT}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => { setHoverIndex(i); const r = containerRef.current.getBoundingClientRect(); setMouse({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onMouseMove={(e) => { const r = containerRef.current.getBoundingClientRect(); setMouse({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}

        {hoverIndex !== null && (
          <line x1={bars[hoverIndex].xMid} y1={TOP_PAD} x2={bars[hoverIndex].xMid} y2={baseY} stroke="#94a3b8" strokeWidth={1} style={{ pointerEvents: "none" }} />
        )}

        {/* 3D bars — front, top, side faces */}
        {bars.map((b, i) => {
          const front = b.color;
          const top = shade(b.color, 24);
          const side = shade(b.color, -20);
          const x1 = b.x0 + barWidth;
          const frontPts = `${b.x0},${baseY} ${x1},${baseY} ${x1},${b.yTop} ${b.x0},${b.yTop}`;
          const topPts = `${b.x0},${b.yTop} ${x1},${b.yTop} ${x1 + depth},${b.yTop - depth} ${b.x0 + depth},${b.yTop - depth}`;
          const sidePts = `${x1},${baseY} ${x1 + depth},${baseY - depth} ${x1 + depth},${b.yTop - depth} ${x1},${b.yTop}`;
          const dim = hoverIndex !== null && hoverIndex !== i;
          return (
            <g key={`bar-${b.defectId || i}`} style={{ pointerEvents: "none", opacity: dim ? 0.55 : 1, transition: "opacity 0.15s" }}>
              <polygon points={sidePts} fill={side} />
              <polygon points={frontPts} fill={front} />
              <polygon points={topPts} fill={top} />
            </g>
          );
        })}

        {/* cumulative % line + dots, drawn above the bars */}
        <path d={linePath} fill="none" stroke="#dc2626" strokeWidth={2.5} style={{ pointerEvents: "none" }} />
        {linePoints.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={hoverIndex === i ? 5 : 3.5} fill="#fff" stroke="#dc2626" strokeWidth={2} style={{ pointerEvents: "none" }} />
        ))}

        {/* x-axis category labels, rotated */}
        {bars.map((b, i) => (
          <text
            key={`xl-${b.defectId || i}`}
            x={b.xMid}
            y={baseY + 14}
            fontSize={9.5}
            fill="#64748b"
            textAnchor="end"
            transform={`rotate(-25 ${b.xMid} ${baseY + 14})`}
          >
            {b.defectName}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg border shadow-lg bg-white px-3 py-2 text-[11px]"
          style={{ left: tipLeft, top: tipTop, borderColor: shade(hovered.color, -10), minWidth: tooltipWidth }}
        >
          <p className="font-bold text-slate-700 mb-1">{hovered.defectName}</p>
          <p className="flex items-center justify-between gap-3">
            <span style={{ color: hovered.color }}>Reject Qty</span>
            <span className="font-semibold text-slate-800">{hovered.quantity.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between gap-3">
            <span className="text-red-600">Cumulative %</span>
            <span className="font-semibold text-red-600">{hovered.cumulativePercent}%</span>
          </p>
        </div>
      )}
    </div>
  );
};

// ============================= main component =============================
const DefectPareto = () => {
  const { defectPareto, qualityLoading } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col" style={{ minHeight: 380 }}>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 size={16} className="text-slate-700" />
        <div>
          <h3 className="text-sm font-semibold text-slate-700 leading-tight">Defect Pareto Analysis</h3>
          <p className="text-[10px] text-slate-400">Selected range — bars = quantity, line = cumulative %</p>
        </div>
      </div>

      {qualityLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !defectPareto?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No defect data available</div>
      ) : (
        <>
          <Pareto3D data={defectPareto} />
          <div className="flex items-center gap-4 mt-2 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-600 inline-block" />
              <span className="text-slate-600">Cumulative %</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
              <span className="text-slate-600">Reject Qty (color per defect)</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default DefectPareto;