import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ShieldCheck } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center justify-between gap-3">
          <span>{entry.name}</span>
          <span className="font-semibold">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
};

const ShiftQualityPerformance = () => {
  const { shiftQualityPerformance, shiftLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <ShieldCheck size={14} className="text-green-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Shift Quality Performance</h3>
          <p className="text-[10px] text-slate-400">Quality · {rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {shiftLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !shiftQualityPerformance?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No shift data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={shiftQualityPerformance} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="shiftName" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis yAxisId="pct" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
            <YAxis yAxisId="fpy" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="pct" dataKey="rejectPercent" name="Reject %" fill="#dc2626" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="pct" dataKey="reworkPercent" name="Rework %" fill="#d97706" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="fpy" dataKey="fpy" name="FPY %" fill="#16a34a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ShiftQualityPerformance;