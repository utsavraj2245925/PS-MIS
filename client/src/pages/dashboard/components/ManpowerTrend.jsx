import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Users } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const formatDateTick = (value) => dayjs(value).format("DD MMM");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-1">{dayjs(label).format("DD MMM YYYY")}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center justify-between gap-3">
          <span>{entry.name}</span>
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const ManpowerTrend = () => {
  const { manpowerTrend, manpowerLoading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Users size={14} className="text-blue-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Manpower Requirement vs Availability</h3>
          <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {manpowerLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !manpowerTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No manpower data available for selected filters</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={manpowerTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="required" name="Required" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="available" name="Available" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="short" name="Short" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ManpowerTrend;