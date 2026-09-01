import React, { useRef, useState, useEffect } from "react";
import { PieChart as PieIcon } from "lucide-react";
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

// ============================= geometry helpers =============================
// angle=0 -> top (12 o'clock), increases clockwise, matching standard pie layout.
const pointOnEllipse = (angle, rx, ry, cx, cy, yOffset = 0) => ({
  x: cx + rx * Math.sin(angle),
  y: cy - ry * Math.cos(angle) + yOffset,
});

const FRONT_START = Math.PI / 2;      // 90deg  — where the visible front wall begins
const FRONT_END = (3 * Math.PI) / 2;  // 270deg — where it ends

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

// ============================= 3D donut renderer =============================
const Donut3D = ({ data }) => {
  const [containerRef, containerWidth] = useContainerWidth();

  const total = data.reduce((s, d) => s + d.value, 0);
  if (!containerWidth || total <= 0) {
    return <div ref={containerRef} className="w-full" style={{ height: 150 }} />;
  }

  const rx = Math.max(60, Math.min(containerWidth * 0.3, 100));
  const ry = rx * 0.55;
  const depth = rx * 0.22;
  const innerRatio = 0.5;
  const irx = rx * innerRatio;
  const iry = ry * innerRatio;

  const topPad = 14;
  const cx = containerWidth / 2;
  const cy = topPad + ry;
  const height = topPad + ry * 2 + depth + 8;

  // Build slice angle ranges, walking clockwise from the top.
  let cursor = 0;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;
    return { ...d, startAngle, endAngle };
  });

  const buildTopFace = (s) => {
    const largeArc = s.endAngle - s.startAngle >= Math.PI ? 1 : 0;
    const oS = pointOnEllipse(s.startAngle, rx, ry, cx, cy);
    const oE = pointOnEllipse(s.endAngle, rx, ry, cx, cy);
    const iE = pointOnEllipse(s.endAngle, irx, iry, cx, cy);
    const iS = pointOnEllipse(s.startAngle, irx, iry, cx, cy);
    return `M ${oS.x} ${oS.y} A ${rx} ${ry} 0 ${largeArc} 1 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${irx} ${iry} 0 ${largeArc} 0 ${iS.x} ${iS.y} Z`;
  };

  const buildWall = (s) => {
    const ws = Math.max(s.startAngle, FRONT_START);
    const we = Math.min(s.endAngle, FRONT_END);
    if (we <= ws) return null;
    const largeArc = we - ws >= Math.PI ? 1 : 0;
    const p1 = pointOnEllipse(ws, rx, ry, cx, cy);
    const p2 = pointOnEllipse(we, rx, ry, cx, cy);
    const p3 = pointOnEllipse(we, rx, ry, cx, cy, depth);
    const p4 = pointOnEllipse(ws, rx, ry, cx, cy, depth);
    return `M ${p1.x} ${p1.y} A ${rx} ${ry} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rx} ${ry} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
  };

  const inlineLabel = (s) => {
    const percent = s.value / total;
    if (percent < 0.06) return null;
    const midAngle = (s.startAngle + s.endAngle) / 2;
    const midRx = (irx + rx) / 2;
    const midRy = (iry + ry) / 2;
    const p = pointOnEllipse(midAngle, midRx, midRy, cx, cy);
    return (
      <text key={`lbl-${s.key}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fontWeight={700} fill="#fff">
        {s.value.toFixed(1)}%
      </text>
    );
  };

  return (
    <div ref={containerRef} className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${containerWidth} ${height}`} style={{ display: "block" }}>
        {/* subtle shadow inside the hole — gives the illusion of depth */}
        <ellipse cx={cx} cy={cy + depth} rx={irx} ry={iry} fill="rgba(15,23,42,0.07)" />

        {/* extruded side walls — only the front-facing (visible) portion */}
        {slices.map((s) => {
          const wallPath = buildWall(s);
          if (!wallPath) return null;
          return <path key={`wall-${s.key}`} d={wallPath} fill={shade(s.color, -22)} />;
        })}

        {/* flat top faces sit above the walls */}
        {slices.map((s) => (
          <path key={`top-${s.key}`} d={buildTopFace(s)} fill={s.color} stroke="#fff" strokeWidth={1}>
            <title>{`${s.name}: ${s.value.toFixed(1)}%`}</title>
          </path>
        ))}

        {slices.map((s) => inlineLabel(s))}
      </svg>
    </div>
  );
};

// ============================= main component =============================
const SLICE_META = {
  effective: { label: "Effective Production", color: "#16a34a" },
  availLoss: { label: "Availability Loss", color: "#ef4444" },
  perfLoss: { label: "Performance Loss", color: "#f59e0b" },
  qualLoss: { label: "Quality Loss", color: "#38bdf8" },
};

const OEELossDonut = () => {
  const { cards, loading } = useDashboard() || {};

  const availability = Number(cards?.availability || 0);
  const performance = Number(cards?.performance || 0);
  const oee = Number(cards?.oee || 0);

  const availLoss = Math.max(100 - availability, 0);
  const afterAvail = (availability * performance) / 100;
  const perfLoss = Math.max(availability - afterAvail, 0);
  const qualLoss = Math.max(afterAvail - oee, 0);
  const effective = Math.max(oee, 0);

  const data = [
    { key: "effective", value: Number(effective.toFixed(2)) },
    { key: "availLoss", value: Number(availLoss.toFixed(2)) },
    { key: "perfLoss", value: Number(perfLoss.toFixed(2)) },
    { key: "qualLoss", value: Number(qualLoss.toFixed(2)) },
  ].map((d) => ({ ...d, name: SLICE_META[d.key].label, color: SLICE_META[d.key].color }));

  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <PieIcon size={14} className="text-red-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">OEE Loss Distribution</h3>
          <p className="text-[10px] text-slate-400">Selected range total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <>
          <Donut3D data={data} />

          {/* Always-visible value list — no hover needed */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {data.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10.5px] text-slate-600 truncate">{entry.name}</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-800 shrink-0">{entry.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OEELossDonut;