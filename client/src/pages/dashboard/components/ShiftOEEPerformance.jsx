import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Gauge } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const gaugeColor = (oee) => (oee >= 85 ? "#16a34a" : oee >= 60 ? "#f59e0b" : "#ef4444");

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700">{d.shiftName}</p>
      <p className="font-semibold" style={{ color: gaugeColor(d.oee) }}>OEE: {d.oee}%</p>
    </div>
  );
};

const ShiftOEEPerformance = () => {
  const { shiftOEEPerformance, shiftLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Gauge size={14} className="text-purple-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Shift OEE Performance</h3>
          <p className="text-[10px] text-slate-400">OEE · {rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {shiftLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !shiftOEEPerformance?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No shift data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={shiftOEEPerformance} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="shiftName" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="oee" radius={[4, 4, 0, 0]}>
              {shiftOEEPerformance.map((d) => <Cell key={d.shiftId} fill={gaugeColor(d.oee)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ShiftOEEPerformance;