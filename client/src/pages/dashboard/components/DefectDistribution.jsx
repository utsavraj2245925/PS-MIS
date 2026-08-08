import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const PALETTE = ["#dc2626", "#f59e0b", "#f97316", "#0d9488", "#2563eb", "#7c3aed", "#db2777", "#64748b"];

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

const DefectDistribution = () => {
  const { defectDistribution, qualityLoading } = useDashboard() || {};

  const data = (defectDistribution || []).map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  const hasData = data.some((d) => d.quantity > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <PieIcon size={14} className="text-orange-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Defect Distribution</h3>
          <p className="text-[10px] text-slate-400">Selected range total</p>
        </div>
      </div>

      {qualityLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No defect data available</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={data} dataKey="quantity" nameKey="defectName" innerRadius="45%" outerRadius="75%" paddingAngle={2} label={renderInlineLabel} labelLine={false}>
                {data.map((entry) => (
                  <Cell key={entry.defectId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} units`, name]} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[10px]">
            {data.map((d) => (
              <div key={d.defectId} className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="truncate text-slate-600">{d.defectName}</span>
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

export default DefectDistribution;