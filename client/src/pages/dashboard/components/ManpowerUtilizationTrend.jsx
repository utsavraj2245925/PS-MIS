import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Gauge } from "lucide-react";
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
      <p>Required: <span className="font-semibold">{d?.required}</span></p>
      <p>Available: <span className="font-semibold">{d?.available}</span></p>
      <p className="text-teal-600">Utilization: <span className="font-semibold">{d?.utilization}%</span></p>
    </div>
  );
};

const ManpowerUtilizationTrend = () => {
  const { manpowerTrend, manpowerLoading, datePreset, dateRange } = useDashboard() || {};

  const avgUtilization = manpowerTrend?.length
    ? (manpowerTrend.reduce((s, d) => s + Number(d.utilization || 0), 0) / manpowerTrend.length).toFixed(2)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Gauge size={14} className="text-teal-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Manpower Utilization</h3>
          <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {manpowerLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !manpowerTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No manpower data available for selected filters</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={manpowerTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="utilization" name="Utilization" stroke="#0d9488" strokeWidth={2} fill="url(#utilFill)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500 mt-1">Avg: <span className="font-semibold text-teal-600">{avgUtilization}%</span></p>
        </>
      )}
    </div>
  );
};

export default ManpowerUtilizationTrend;