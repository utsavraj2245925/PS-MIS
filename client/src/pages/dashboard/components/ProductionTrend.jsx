import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const formatDateTick = (value) => dayjs(value).format("DD MMM");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-0.5">{dayjs(label).format("DD MMM YYYY")}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center justify-between gap-4">
          <span>{entry.name}</span>
          <span className="font-semibold">{Number(entry.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

const ProductionTrend = () => {
  const { productionTrend, trendLoading, datePreset, dateRange } = useDashboard() || {};

  const totalProduction = productionTrend?.length
    ? productionTrend.reduce((s, d) => s + Number(d.production || 0), 0)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-blue-600" />
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Daily Production vs Target Trend</h3>
            <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
          </div>
        </div>
      </div>

      {trendLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !productionTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No data for selected range</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={productionTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="production" name="Production" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="target" name="Target" stroke="#0d9488" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500 mt-1">Total: <span className="font-semibold text-blue-600">{totalProduction.toLocaleString()}</span></p>
        </>
      )}
    </div>
  );
};

export default ProductionTrend;