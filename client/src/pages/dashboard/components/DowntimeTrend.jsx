import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Clock3 } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const formatDateTick = (value) => dayjs(value).format("DD MMM");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-1">{dayjs(label).format("DD MMM YYYY")}</p>
      <p className="text-blue-600">Planned: <span className="font-semibold">{d?.planned} min</span></p>
      <p className="text-red-600">Unplanned: <span className="font-semibold">{d?.unplanned} min</span></p>
      <p className="text-slate-700 border-t border-slate-100 mt-1 pt-1">Total: <span className="font-semibold">{d?.total} min</span></p>
    </div>
  );
};

const DowntimeTrend = () => {
  const { downtimeTrend, downtimeLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Clock3 size={14} className="text-purple-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Downtime Trend</h3>
          <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {downtimeLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !downtimeTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No downtime data available for selected filters</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={downtimeTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="plannedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="unplannedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit=" min" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="planned" name="Planned" stackId="dt" stroke="#2563eb" strokeWidth={2} fill="url(#plannedFill)" />
            <Area type="monotone" dataKey="unplanned" name="Unplanned" stackId="dt" stroke="#dc2626" strokeWidth={2} fill="url(#unplannedFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DowntimeTrend;