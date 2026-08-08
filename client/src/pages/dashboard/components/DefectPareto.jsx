import React from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
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
          <span className="font-semibold">{entry.value}{entry.dataKey === "cumulativePercent" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
};

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
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={defectPareto} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="defectName" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} angle={-20} textAnchor="end" height={50} />
            <YAxis yAxisId="qty" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine yAxisId="pct" y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "80%", fontSize: 10, fill: "#dc2626", position: "right" }} />
            <Bar yAxisId="qty" dataKey="quantity" name="Reject Qty" fill="#2563eb" radius={[3, 3, 0, 0]} />
            <Line yAxisId="pct" type="monotone" dataKey="cumulativePercent" name="Cumulative %" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DefectPareto;