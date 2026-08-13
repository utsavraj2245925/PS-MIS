import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700">{d.shiftName}</p>
      <p className="text-blue-600 font-semibold">{d.productionQty.toLocaleString()} units</p>
    </div>
  );
};

const ShiftProductionPerformance = () => {
  const { shiftProductionPerformance, shiftLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <TrendingUp size={14} className="text-blue-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Shift Production Performance</h3>
          <p className="text-[10px] text-slate-400">Production Volume · {rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {shiftLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !shiftProductionPerformance?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No shift data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={shiftProductionPerformance} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="shiftName" width={70} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="productionQty" fill="#2563eb" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ShiftProductionPerformance;