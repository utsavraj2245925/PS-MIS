import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Clock3 } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-blue-600">Planned: <span className="font-semibold">{d?.plannedDowntime} min</span></p>
      <p className="text-red-600">Unplanned: <span className="font-semibold">{d?.unplannedDowntime} min</span></p>
      <p className="text-slate-700 border-t border-slate-100 mt-1 pt-1">Total: <span className="font-semibold">{d?.totalDowntime} min</span></p>
    </div>
  );
};

const ShiftDowntimePerformance = () => {
  const { shiftDowntimePerformance, shiftLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Clock3 size={14} className="text-red-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Shift Downtime Performance</h3>
          <p className="text-[10px] text-slate-400">Downtime · {rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {shiftLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !shiftDowntimePerformance?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No shift data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={shiftDowntimePerformance} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit=" min" />
            <YAxis type="category" dataKey="shiftName" width={70} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="plannedDowntime" name="Planned" stackId="dt" fill="#2563eb" />
            <Bar dataKey="unplannedDowntime" name="Unplanned" stackId="dt" fill="#dc2626" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ShiftDowntimePerformance;