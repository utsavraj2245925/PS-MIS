import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Gauge } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";

const formatDateTick = (value) => dayjs(value).format("DD MMM");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{dayjs(label).format("DD MMM YYYY")}</p>
      <p className="text-teal-600 font-semibold">{payload[0].value}% Achievement</p>
    </div>
  );
};

const AchievementTrend = () => {
  const { achievementTrend, trendLoading } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Gauge size={16} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-700">Achievement Trend %</h3>
      </div>

      {trendLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      ) : !achievementTrend?.length ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data for selected range</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={achievementTrend} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="achievementFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="achievement" name="Achievement" stroke="#0d9488" strokeWidth={2} fill="url(#achievementFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AchievementTrend;