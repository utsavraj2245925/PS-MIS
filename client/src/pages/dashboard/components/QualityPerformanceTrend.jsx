import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
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
          <span className="font-semibold">{entry.value}{entry.dataKey === "fpy" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
};

const QualityPerformanceTrend = () => {
  const { qualityPerformanceTrend, qualityLoading, datePreset, dateRange } = useDashboard() || {};

  const avgFpy = qualityPerformanceTrend?.length
    ? (qualityPerformanceTrend.reduce((s, d) => s + Number(d.fpy || 0), 0) / qualityPerformanceTrend.length).toFixed(2)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <TrendingUp size={14} className="text-teal-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">PPM & FPY Trend</h3>
          <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      {qualityLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !qualityPerformanceTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={qualityPerformanceTrend} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis yAxisId="ppm" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="fpy" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line yAxisId="ppm" type="monotone" dataKey="ppm" name="PPM" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line yAxisId="fpy" type="monotone" dataKey="fpy" name="FPY %" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500 mt-1">Avg FPY: <span className="font-semibold text-green-600">{avgFpy}%</span></p>
        </>
      )}
    </div>
  );
};

export default QualityPerformanceTrend;