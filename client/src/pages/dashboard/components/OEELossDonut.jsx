import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

// Standard OEE waterfall decomposition — these 4 slices always sum to 100%:
//   Availability Loss = 100 - availability
//   Performance Loss  = availability - (availability * performance / 100)
//   Quality Loss       = (availability * performance / 100) - oee
//   Effective (Good)   = oee
const SLICE_META = {
  effective: { label: "Effective Production", color: "#16a34a" },
  availLoss: { label: "Availability Loss", color: "#ef4444" },
  perfLoss:  { label: "Performance Loss", color: "#f59e0b" },
  qualLoss:  { label: "Quality Loss", color: "#f97316" },
};

// Renders the % directly inside a slice — only for slices big enough to fit
// text without colliding with the wedge next to it. Small slices (<6%)
// skip inline text and rely on the always-visible legend list below instead.
const renderInlineLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.06) return null;
  const RAD = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {value.toFixed(1)}%
    </text>
  );
};

const OEELossDonut = () => {
  const { cards, loading } = useDashboard() || {};

  const availability = Number(cards?.availability || 0);
  const performance = Number(cards?.performance || 0);
  const oee = Number(cards?.oee || 0);

  const availLoss = Math.max(100 - availability, 0);
  const afterAvail = (availability * performance) / 100;
  const perfLoss = Math.max(availability - afterAvail, 0);
  const qualLoss = Math.max(afterAvail - oee, 0);
  const effective = Math.max(oee, 0);

  const data = [
    { key: "effective", value: Number(effective.toFixed(2)) },
    { key: "availLoss", value: Number(availLoss.toFixed(2)) },
    { key: "perfLoss", value: Number(perfLoss.toFixed(2)) },
    { key: "qualLoss", value: Number(qualLoss.toFixed(2)) },
  ].map((d) => ({ ...d, name: SLICE_META[d.key].label, color: SLICE_META[d.key].color }));

  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-center gap-1.5 mb-1">
        <PieIcon size={14} className="text-red-600" />
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">OEE Loss Distribution</h3>
          <p className="text-[10px] text-slate-400">Selected range total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="52%"
                outerRadius="82%"
                paddingAngle={2}
                labelLine={false}
                label={renderInlineLabel}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} stroke="#fff" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>

          {/* Always-visible value list — no hover needed, never overlaps
              since it's a plain HTML grid, not SVG labels on thin slices. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {data.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10.5px] text-slate-600 truncate">{entry.name}</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-800 shrink-0">{entry.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OEELossDonut;