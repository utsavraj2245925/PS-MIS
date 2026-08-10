import React from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { Grid3x3 } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const PALETTE = ["#2563eb", "#0d9488", "#f59e0b", "#7c3aed", "#dc2626", "#db2777", "#16a34a", "#64748b"];

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

const CustomCell = ({ x, y, width, height, index, partName, quantity }) => {
  const color = PALETTE[index % PALETTE.length];
  const showLabel = width > 45 && height > 30;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="#fff" strokeWidth={1.5} rx={2} />
      {showLabel && (
        <text x={x + 5} y={y + 14} fill="#fff" fontSize={10} fontWeight={700}>
          {partName?.length > 12 ? `${partName.slice(0, 12)}…` : partName}
        </text>
      )}
      {showLabel && (
        <text x={x + 5} y={y + 27} fill="#fff" fontSize={9} opacity={0.85}>
          {quantity?.toLocaleString()}
        </text>
      )}
    </g>
  );
};

const PartPerformanceDistribution = () => {
  const { partPerformanceDistribution, modelPartLoading } = useDashboard() || {};

  const data = (partPerformanceDistribution || []).map((p) => ({ ...p, size: p.quantity }));
  const hasData = data.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Grid3x3 size={14} className="text-amber-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Part Performance Distribution</h3>
          <p className="text-[10px] text-slate-400">Production Volume Map</p>
        </div>
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <Treemap data={data} dataKey="size" stroke="#fff" content={<CustomCell />} />
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PartPerformanceDistribution;