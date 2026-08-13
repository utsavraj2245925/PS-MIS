import React from "react";
import { Ruler } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const PaintedArea = () => {
  const { cards, loading, datePreset, dateRange } = useDashboard() || {};

  return (
    <div
      className="relative rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white p-3 shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ height: 380 }}
    >
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-cyan-100/60" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-cyan-50" />

      <div className="relative flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
          <Ruler size={14} className="text-cyan-700" />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Painted Area</h3>
          <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <span className="text-slate-400 text-xs">Loading...</span>
        ) : (
          <>
            <span className="text-5xl font-black tabular-nums bg-gradient-to-br from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
              {(cards?.paintedArea ?? 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-cyan-700/70 mt-1.5 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-100">
              {cards?.paintedAreaUnit || "m²"}
            </span>
          </>
        )}
      </div>

      <p className="relative text-[10px] text-slate-400 text-center">Actual painted coverage — selected scope</p>
    </div>
  );
};

export default PaintedArea;