import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const formatDateTick = (value) => dayjs(value).format("DD MMM");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700 mb-0.5">{dayjs(label).format("DD MMM YYYY")}</p>
      <p className="text-amber-600 font-semibold">{payload[0].value} /hr</p>
    </div>
  );
};

const ProductionRateTrend = () => {
  const { productionRateTrend, trendLoading, datePreset, dateRange } = useDashboard() || {};

  const avgRate = productionRateTrend?.length
    ? (productionRateTrend.reduce((s, d) => s + Number(d.productionRate || 0), 0) / productionRateTrend.length).toFixed(2)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-amber-600" />
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Production Rate</h3>
            <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
          </div>
        </div>
      </div>

      {trendLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !productionRateTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={productionRateTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="productionRate" name="Production Rate" stroke="#d97706" strokeWidth={2} fill="url(#rateFill)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500 mt-1">Avg: <span className="font-semibold text-amber-600">{avgRate}/hr</span></p>
        </>
      )}
    </div>
  );
};

export default ProductionRateTrend;