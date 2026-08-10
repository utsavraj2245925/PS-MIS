import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const PALETTE = ["#2563eb", "#0d9488", "#f59e0b", "#7c3aed", "#dc2626", "#db2777", "#64748b"];

const renderInlineLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {(percent * 100).toFixed(1)}%
    </text>
  );
};

const ModelProductionContribution = () => {
  const { modelProductionContribution, modelPartLoading } = useDashboard() || {};
  const { total = 0, models = [] } = modelProductionContribution || {};

  const data = models.map((m, i) => ({ ...m, color: PALETTE[i % PALETTE.length] }));
  const hasData = data.some((d) => d.quantity > 0);

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
          <div className="relative" style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="quantity" nameKey="modelName" innerRadius="55%" outerRadius="85%" paddingAngle={2} label={renderInlineLabel} labelLine={false}>
                  {data.map((entry) => <Cell key={entry.modelId} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value.toLocaleString()} units`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Total</span>
              <span className="text-sm font-black text-slate-800">{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px] overflow-y-auto" style={{ maxHeight: 70 }}>
            {data.map((d) => (
              <div key={d.modelId} className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="truncate text-slate-600">{d.modelName}</span>
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