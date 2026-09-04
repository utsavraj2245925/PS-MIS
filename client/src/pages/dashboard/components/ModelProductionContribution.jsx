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

// ============================= glossy 3D pie chart =============================
// A true solid pie (no donut hole) — slice angle is proportional to value,
// like a classic pie, extruded into a tilted ellipse with a uniform depth
// and a soft diagonal highlight overlay to mimic the glassy/glossy shine
// from the reference image.
const GlossyPie3D = ({ data, hoverFormatter }) => {
  const [containerRef, containerWidth] = useContainerWidth();
  const [hovered, setHovered] = useState(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  const n = data.length;

  if (!containerWidth || total <= 0 || n === 0) {
    return <div ref={containerRef} className="w-full" style={{ height: 190 }} />;
  }

  const rx = Math.max(64, Math.min(containerWidth * 0.32, 108));
  const ry = rx * 0.58;
  const depth = rx * 0.24;

  const topPad = 14;
  const cx = containerWidth / 2;
  const cy = topPad + ry;
  const height = topPad + ry * 2 + depth + 10;

  let cursor = 0;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;
    return { ...d, startAngle, endAngle };
  });

  // Full wedge from the center out to the rim and back — a true pie slice,
  // not an annulus segment.
  const buildTopFace = (s) => {
    const largeArc = s.endAngle - s.startAngle >= Math.PI ? 1 : 0;
    const oS = pointOnEllipse(s.startAngle, rx, ry, cx, cy);
    const oE = pointOnEllipse(s.endAngle, rx, ry, cx, cy);
    return `M ${cx} ${cy} L ${oS.x} ${oS.y} A ${rx} ${ry} 0 ${largeArc} 1 ${oE.x} ${oE.y} Z`;
  };

  const buildOuterWall = (s) => {
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

  // Straight radial cut face — always drawn along both edges of every
  // slice so the wedge boundaries read clearly, matching the crisp
  // slice separations visible in the reference pie.
  const buildRadialWall = (theta) => {
    const oTop = pointOnEllipse(theta, rx, ry, cx, cy, 0);
    const oBot = pointOnEllipse(theta, rx, ry, cx, cy, depth);
    return `M ${cx} ${cy} L ${oTop.x} ${oTop.y} L ${oBot.x} ${oBot.y} L ${cx} ${cy + depth} Z`;
  };

  const inlineLabel = (s) => {
    const percent = s.value / total;
    if (percent < 0.035) return null;
    const midAngle = (s.startAngle + s.endAngle) / 2;
    const p = pointOnEllipse(midAngle, rx * 0.62, ry * 0.62, cx, cy);
    const label = `${(percent * 100).toFixed(1)}%`;
    return (
      <text key={`lbl-${s.key}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fontWeight={700} fill="#fff" style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
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

  const gradId = "pieGloss3D";

  return (
    <div ref={containerRef} className="w-full relative">
      <svg width="100%" height={height} viewBox={`0 0 ${containerWidth} ${height}`} style={{ display: "block" }}>
        <defs>
          <radialGradient id={gradId} cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft ground shadow beneath the pie */}
        <ellipse cx={cx} cy={cy + depth + 3} rx={rx * 0.92} ry={ry * 0.35} fill="rgba(15,23,42,0.10)" />

        {/* side walls (radial cuts + outer rim), drawn before tops */}
        {slices.map((s) => (
          <g key={`walls-${s.key}`}>
            <path d={buildRadialWall(s.startAngle)} fill={shade(s.color, -30)} />
            <path d={buildRadialWall(s.endAngle)} fill={shade(s.color, -30)} />
            {buildOuterWall(s) && <path d={buildOuterWall(s)} fill={shade(s.color, -16)} />}
          </g>
        ))}

        {/* top wedge faces */}
        {slices.map((s) => (
          <path
            key={`top-${s.key}`}
            d={buildTopFace(s)}
            fill={s.color}
            stroke="#fff"
            strokeWidth={1.4}
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => handleEnter(s, e)}
            onMouseMove={(e) => handleMove(s, e)}
            onMouseLeave={handleLeave}
          />
        ))}

        {/* single diagonal gloss overlay across the whole pie top — this
            is what gives the glassy/reflective sheen from the reference,
            rather than a flat matte fill */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${gradId})`} style={{ pointerEvents: "none" }} />

        {slices.map((s) => inlineLabel(s))}
      </svg>

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
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <PieIcon size={14} className="text-purple-600 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Production Contribution by Model</h3>
            <p className="text-[10px] text-slate-400">Production Volume Distribution</p>
          </div>
        </div>
        {hasData && !modelPartLoading && (
          <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap flex-shrink-0">
            Total {total.toLocaleString()}
          </span>
        )}
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center">
            <GlossyPie3D
              data={data}
              hoverFormatter={(s) => `${s.name} : ${s.value.toLocaleString()} units`}
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