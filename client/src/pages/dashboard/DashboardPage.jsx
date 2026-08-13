import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import { Spin } from "antd";
import ExecutiveKPICards from "./components/ExecutiveKPICards";
import ProductionTrend from "./components/ProductionTrend";
import AchievementTrend from "./components/AchievementTrend";
import ProductionRateTrend from "./components/ProductionRateTrend";
import OEETrend from "./components/OEETrend";
import OEEComponentsTrend from "./components/OEEComponentsTrend";
import OEELossDonut from "./components/OEELossDonut";
import QualityTrend from "./components/QualityTrend";
import QualityPerformanceTrend from "./components/QualityPerformanceTrend";
import DefectDistribution from "./components/DefectDistribution";
import DefectPareto from "./components/DefectPareto";
import TopPerformingModels from "./components/TopPerformingModels";
import TopPerformingParts from "./components/TopPerformingParts";
import ModelProductionContribution from "./components/ModelProductionContribution";
import PartPerformanceDistribution from "./components/PartPerformanceDistribution";
import PaintedArea from "./components/PaintedArea";
import PowderConsumption from "./components/PowderConsumption";
import UsefulItems from "./components/UsefulItems";
import ChemicalConsumption from "./components/ChemicalConsumption";
import DowntimeTrend from "./components/DowntimeTrend";
import DowntimeTypeDistribution from "./components/DowntimeTypeDistribution";
import TopDowntimeReasons from "./components/TopDowntimeReasons";
import DowntimePareto from "./components/DowntimePareto";
import ManpowerTrend from "./components/ManpowerTrend";
import ManpowerUtilizationTrend from "./components/ManpowerUtilizationTrend";
import ManpowerDistribution from "./components/ManpowerDistribution";
import ManpowerShortageByShift from "./components/ManpowerShortageByShift";
import ShiftProductionPerformance from "./components/ShiftProductionPerformance";
import ShiftOEEPerformance from "./components/ShiftOEEPerformance";
import ShiftQualityPerformance from "./components/ShiftQualityPerformance";
import ShiftDowntimePerformance from "./components/ShiftDowntimePerformance";

const DashboardPage = () => {
  const { cards, loading } = useDashboard() || {};

  if (loading) return <Spin fullscreen />;

  return (
    <div className="space-y-4">
      <ExecutiveKPICards cards={cards} />

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Production Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <ProductionTrend />
          <AchievementTrend />
          <ProductionRateTrend />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">OEE Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <OEETrend />
          <OEEComponentsTrend />
          <OEELossDonut />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Quality Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-3">
          <QualityTrend />
          <QualityPerformanceTrend />
          <DefectDistribution />
        </div>
        <DefectPareto />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Model & Part Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <TopPerformingModels />
          <TopPerformingParts />
          <ModelProductionContribution />
          <PartPerformanceDistribution />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Paint Shop Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <PaintedArea />
          <PowderConsumption />
          <UsefulItems />
          <ChemicalConsumption />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Downtime Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <DowntimeTrend />
          <DowntimeTypeDistribution />
          <TopDowntimeReasons />
          <DowntimePareto />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Manpower Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <ManpowerTrend />
          <ManpowerUtilizationTrend />
          <ManpowerDistribution />
          <ManpowerShortageByShift />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Shift Performance Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <ShiftProductionPerformance />
          <ShiftOEEPerformance />
          <ShiftQualityPerformance />
          <ShiftDowntimePerformance />
        </div>
      </div>
    </div>

    
  );
};

export default DashboardPage;