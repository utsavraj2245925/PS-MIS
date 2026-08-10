import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Select } from "antd";
import { Wrench } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px]">
      <p className="font-semibold text-slate-700">{d.partName}</p>
      {d.modelName && <p className="text-slate-400">{d.modelName}</p>}
      <p className="text-teal-600 font-semibold">{d.quantity.toLocaleString()} units</p>
    </div>
  );
};

const TopPerformingParts = () => {
  const { topParts, topModels, modelPartLoading, selectedPartModel, handlePartModelChange, datePreset, dateRange } = useDashboard() || {};

  const modelOptions = [
    { value: "", label: "All Models" },
    ...(topModels || []).map((m) => ({ value: m.modelId, label: m.modelName })),
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Wrench size={14} className="text-teal-600" />
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Top Performing Parts</h3>
            <p className="text-[10px] text-slate-400">Production Volume · {rangeLabelFromPreset(datePreset, dateRange)}</p>
          </div>
        </div>
        <Select
          size="small"
          style={{ width: 110 }}
          value={selectedPartModel || ""}
          onChange={handlePartModelChange}
          options={modelOptions}
        />
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !topParts?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topParts} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="partName" width={90} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quantity" fill="#0d9488" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopPerformingParts;