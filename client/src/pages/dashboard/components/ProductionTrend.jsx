import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";

const formatDateTick = (value) => dayjs(value).format("DD MMM");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{dayjs(label).format("DD MMM YYYY")}</p>
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
  const { productionTrend, trendLoading } = useDashboard() || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-700">Daily Production vs Target Trend</h3>
      </div>

      {trendLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      ) : !productionTrend?.length ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data for selected range</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={productionTrend} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="production" name="Production" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="target" name="Target" stroke="#0d9488" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ProductionTrend;