import React from "react";
import { Gauge } from "lucide-react";
import dayjs from "dayjs";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";
import Achievement3DBars from "./Achievement3DBars";

const AchievementTrend = () => {
  const { achievementTrend, trendLoading, datePreset, dateRange } = useDashboard() || {};

  const avgAchievement = achievementTrend?.length
    ? (achievementTrend.reduce((s, d) => s + Number(d.achievement || 0), 0) / achievementTrend.length).toFixed(2)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Gauge size={14} className="text-teal-600" />
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Achievement Trend %</h3>
            <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
          </div>
        </div>
      </div>

      {trendLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !achievementTrend?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No data for selected range</div>
      ) : (
        <>
          <div className="flex-1 flex items-end">
            <Achievement3DBars
              data={achievementTrend}
              valueKey="achievement"
              suffix="%"
              formatLabel={(d) => dayjs(d.date).format("DD MMM")}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Avg: <span className="font-semibold text-teal-600">{avgAchievement}%</span></p>
        </>
      )}
    </div>
  );
};

export default AchievementTrend;