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
    </div>
  );
};

export default DashboardPage;