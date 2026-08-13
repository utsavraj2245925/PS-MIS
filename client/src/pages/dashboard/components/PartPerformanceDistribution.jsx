import React from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { Grid3x3 } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const PALETTE = ["#2563eb", "#0d9488", "#f59e0b", "#7c3aed", "#dc2626", "#db2777", "#16a34a", "#0891b2", "#ca8a04", "#4f46e5", "#059669", "#e11d48", "#0284c7", "#a16207"];
const OTHER_COLOR = "#94a3b8";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700">{d.partName}</p>
      {d.modelName && <p className="text-slate-400">{d.modelName}</p>}
      <p className="text-slate-600 font-semibold">{d.quantity?.toLocaleString()} units</p>
    </div>
  );
};

const CustomCell = ({ x, y, width, height, index, partName, quantity, isOther }) => {
  const color = isOther ? OTHER_COLOR : PALETTE[index % PALETTE.length];
  const showLabel = width > 48 && height > 32;
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={color}
        stroke="#fff"
        strokeWidth={1.5}
        rx={3}
        style={isOther ? { fillOpacity: 0.85 } : undefined}
      />
      {showLabel && (
        <text x={x + 6} y={y + 15} fill="#fff" fontSize={10.5} fontWeight={700}>
          {partName?.length > 13 ? `${partName.slice(0, 13)}…` : partName}
        </text>
      )}
      {showLabel && (
        <text x={x + 6} y={y + 28} fill="#fff" fontSize={9.5} opacity={0.9}>
          {quantity?.toLocaleString()}
        </text>
      )}
    </g>
  );
};

const PartPerformanceDistribution = () => {
  const { partPerformanceDistribution, modelPartLoading } = useDashboard() || {};
  const { parts = [], totalPartCount = 0 } = partPerformanceDistribution || {};

  const data = parts.map((p) => ({ ...p, size: p.quantity }));
  const hasData = data.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Grid3x3 size={14} className="text-amber-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Part Performance Distribution</h3>
          <p className="text-[10px] text-slate-400">
            {totalPartCount > 14 ? `Top 14 of ${totalPartCount} parts` : "Production Volume Map"}
          </p>
        </div>
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <Treemap data={data} dataKey="size" stroke="#fff" isAnimationActive={false} content={<CustomCell />} />
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PartPerformanceDistribution;