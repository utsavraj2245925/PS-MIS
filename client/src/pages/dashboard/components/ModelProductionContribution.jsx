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

const PALETTE = ["#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#0d9488", "#db2777", "#f59e0b", "#0ea5e9"];

// ============================= geometry helpers =============================
const pointOnEllipse = (angle, rx, ry, cx, cy, yOffset = 0) => ({
  x: cx + rx * Math.sin(angle),
  y: cy - ry * Math.cos(angle) + yOffset,
});

const FRONT_START = Math.PI / 2;
const FRONT_END = (3 * Math.PI) / 2;
const GAP_ANGLE = 0.045;

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

// ============================= stepped 3D donut =============================
// Each slice takes EQUAL angular width — the WALL HEIGHT (extrusion depth)
// encodes value instead, so the ring reads as a staircase of steps growing
// taller for bigger contributors, matching the reference "3D stepping" look.
const SteppedDonut3D = ({ data, centerLabel, hoverFormatter }) => {
  const [containerRef, containerWidth] = useContainerWidth();
  const [hovered, setHovered] = useState(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  const n = data.length;

  if (!containerWidth || total <= 0 || n === 0) {
    return <div ref={containerRef} className="w-full" style={{ height: 190 }} />;
  }

  const rx = Math.max(58, Math.min(containerWidth * 0.28, 96));
  const ry = rx * 0.55;
  const irx = rx * 0.48;
  const iry = ry * 0.48;

  const minDepth = rx * 0.14;
  const maxDepth = rx * 0.5;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const topPad = 14;
  const cx = containerWidth / 2;
  const cy = topPad + ry;
  const height = topPad + ry * 2 + maxDepth + 10;

  const anglePer = (Math.PI * 2) / n;
  const slices = data.map((d, i) => {
    const startAngle = i * anglePer + GAP_ANGLE / 2;
    const endAngle = (i + 1) * anglePer - GAP_ANGLE / 2;
    const depth = minDepth + (d.value / maxValue) * (maxDepth - minDepth);
    return { ...d, startAngle, endAngle, depth };
  });

  const buildTopFace = (s) => {
    const largeArc = s.endAngle - s.startAngle >= Math.PI ? 1 : 0;
    const oS = pointOnEllipse(s.startAngle, rx, ry, cx, cy);
    const oE = pointOnEllipse(s.endAngle, rx, ry, cx, cy);
    const iE = pointOnEllipse(s.endAngle, irx, iry, cx, cy);
    const iS = pointOnEllipse(s.startAngle, irx, iry, cx, cy);
    return `M ${oS.x} ${oS.y} A ${rx} ${ry} 0 ${largeArc} 1 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${irx} ${iry} 0 ${largeArc} 0 ${iS.x} ${iS.y} Z`;
  };

  const buildOuterWall = (s) => {
    const ws = Math.max(s.startAngle, FRONT_START);
    const we = Math.min(s.endAngle, FRONT_END);
    if (we <= ws) return null;
    const largeArc = we - ws >= Math.PI ? 1 : 0;
    const p1 = pointOnEllipse(ws, rx, ry, cx, cy);
    const p2 = pointOnEllipse(we, rx, ry, cx, cy);
    const p3 = pointOnEllipse(we, rx, ry, cx, cy, s.depth);
    const p4 = pointOnEllipse(ws, rx, ry, cx, cy, s.depth);
    return `M ${p1.x} ${p1.y} A ${rx} ${ry} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rx} ${ry} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
  };

  const buildRadialWall = (theta, depth) => {
    const oTop = pointOnEllipse(theta, rx, ry, cx, cy, 0);
    const iTop = pointOnEllipse(theta, irx, iry, cx, cy, 0);
    const iBot = pointOnEllipse(theta, irx, iry, cx, cy, depth);
    const oBot = pointOnEllipse(theta, rx, ry, cx, cy, depth);
    return `M ${oTop.x} ${oTop.y} L ${iTop.x} ${iTop.y} L ${iBot.x} ${iBot.y} L ${oBot.x} ${oBot.y} Z`;
  };

  const inlineLabel = (s) => {
    const percent = s.value / total;
    const midAngle = (s.startAngle + s.endAngle) / 2;
    const midRx = (irx + rx) / 2;
    const midRy = (iry + ry) / 2;
    const p = pointOnEllipse(midAngle, midRx, midRy, cx, cy);
    const label = `${(percent * 100).toFixed(1)}%`;
    const fontSize = label.length > 4 ? 8.5 : 10;
    return (
      <text key={`lbl-${s.key}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight={700} fill="#fff" style={{ pointerEvents: "none" }}>
        {label}
      </text>
    );
  };

  const handleEnter = (s, evt) => {
    const rect = containerRef.current.getBoundingClientRect();
    setHovered({ slice: s, x: evt.clientX - rect.left, y: evt.clientY - rect.top });
  };
  const handleMove = (s, evt) => {
    const rect = containerRef.current.getBoundingClientRect();
    setHovered({ slice: s, x: evt.clientX - rect.left, y: evt.clientY - rect.top });
  };
  const handleLeave = () => setHovered(null);

  const tooltipWidth = 168;
  let tipLeft = hovered ? hovered.x + 14 : 0;
  if (hovered && tipLeft + tooltipWidth > containerWidth) tipLeft = hovered.x - tooltipWidth - 14;
  const tipTop = hovered ? Math.max(0, hovered.y - 34) : 0;

  return (
    <div ref={containerRef} className="w-full relative">
      <svg width="100%" height={height} viewBox={`0 0 ${containerWidth} ${height}`} style={{ display: "block" }}>
        <ellipse cx={cx} cy={cy + minDepth * 0.6} rx={irx} ry={iry} fill="rgba(15,23,42,0.06)" />

        {slices.map((s) => (
          <g key={`walls-${s.key}`}>
            <path d={buildRadialWall(s.startAngle, s.depth)} fill={shade(s.color, -32)} />
            <path d={buildRadialWall(s.endAngle, s.depth)} fill={shade(s.color, -32)} />
            {buildOuterWall(s) && <path d={buildOuterWall(s)} fill={shade(s.color, -18)} />}
          </g>
        ))}

        {slices.map((s) => (
          <path
            key={`top-${s.key}`}
            d={buildTopFace(s)}
            fill={s.color}
            stroke="#fff"
            strokeWidth={1}
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => handleEnter(s, e)}
            onMouseMove={(e) => handleMove(s, e)}
            onMouseLeave={handleLeave}
          />
        ))}

        {slices.map((s) => inlineLabel(s))}
      </svg>

      {centerLabel && (
        <div
          className="absolute flex flex-col items-center pointer-events-none"
          style={{ left: "50%", top: cy, transform: "translate(-50%, -50%)" }}
        >
          {centerLabel}
        </div>
      )}

      {hovered && (
        <div
          className="absolute z-10 pointer-events-none rounded-md border shadow-lg bg-white px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap"
          style={{ left: tipLeft, top: tipTop, borderColor: shade(hovered.slice.color, -10), color: hovered.slice.color }}
        >
          {hoverFormatter ? hoverFormatter(hovered.slice) : `${hovered.slice.name} : ${hovered.slice.value}`}
        </div>
      )}
    </div>
  );
};

// ============================= main component =============================
const ModelProductionContribution = () => {
  const { modelProductionContribution, modelPartLoading } = useDashboard() || {};
  const { total = 0, models = [] } = modelProductionContribution || {};

  const data = models.map((m, i) => ({
    key: m.modelId,
    name: m.modelName,
    value: m.quantity,
    percentage: m.percentage,
    color: PALETTE[i % PALETTE.length],
  }));
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <PieIcon size={14} className="text-purple-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Production Contribution by Model</h3>
          <p className="text-[10px] text-slate-400">Production Volume Distribution</p>
        </div>
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center">
            <SteppedDonut3D
              data={data}
              hoverFormatter={(s) => `${s.name} : ${s.value.toLocaleString()} units`}
              centerLabel={
                <>
                  <span className="text-[8.5px] text-slate-400 uppercase font-semibold">Total</span>
                  <span className="text-sm font-black text-slate-800 whitespace-nowrap">{total.toLocaleString()}</span>
                </>
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px] overflow-y-auto" style={{ maxHeight: 70 }}>
            {data.map((d) => (
              <div key={d.key} className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="truncate text-slate-600">{d.name}</span>
                </span>
                <span className="font-semibold text-slate-700 flex-shrink-0">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelProductionContribution;