import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const COLORS = { Planned: "#2563eb", Unplanned: "#dc2626" };

const DowntimeTypeDistribution = () => {
  const { downtimeTypeDistribution, downtimeLoading } = useDashboard() || {};
  const { total = 0, types = [] } = downtimeTypeDistribution || {};

  const data = types.map((t) => ({ ...t, color: COLORS[t.name] || "#64748b" }));
  const hasData = data.some((d) => d.minutes > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <PieIcon size={14} className="text-blue-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Planned vs Unplanned</h3>
          <p className="text-[10px] text-slate-400">Selected range total</p>
        </div>
      </div>

      {downtimeLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No downtime data available for selected filters</div>
      ) : (
        <>
          <div className="relative" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="minutes" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                  {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} min`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Total</span>
              <span className="text-lg font-black text-slate-800">{total}</span>
              <span className="text-[9px] text-slate-400">min</span>
            </div>
          </div>

          <div className="space-y-1 mt-2 text-[11px]">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </span>
                <span className="font-semibold text-slate-700">{d.minutes} min · {d.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DowntimeTypeDistribution;