import React from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center justify-between gap-3">
          <span>{entry.name}</span>
          <span className="font-semibold">{entry.value}{entry.dataKey === "cumulativePercent" ? "%" : " min"}</span>
        </p>
      ))}
    </div>
  );
};

const DowntimePareto = () => {
  const { downtimePareto, downtimeLoading } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <BarChart3 size={14} className="text-slate-700" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Downtime Pareto</h3>
          <p className="text-[10px] text-slate-400">Bars = minutes, line = cumulative %</p>
        </div>
      </div>

      {downtimeLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !downtimePareto?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No downtime data available for selected filters</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={downtimePareto} margin={{ top: 5, right: 16, left: -8, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} angle={-35} textAnchor="end" height={55} interval={0} />
            <YAxis yAxisId="min" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="pct" y={80} stroke="#dc2626" strokeDasharray="4 4" />
            <Bar yAxisId="min" dataKey="minutes" name="Minutes" fill="#7c3aed" radius={[2, 2, 0, 0]} />
            <Line yAxisId="pct" type="monotone" dataKey="cumulativePercent" name="Cumulative %" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DowntimePareto;