import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import { Spin } from "antd";
import ExecutiveKPICards from "./components/ExecutiveKPICards";
import ProductionTrend from "./components/ProductionTrend";
import AchievementTrend from "./components/AchievementTrend";

const DashboardPage = () => {
  const { cards, loading } = useDashboard() || {};

  if (loading) return <Spin fullscreen />;

  return (
    <div className="space-y-4">
      <ExecutiveKPICards cards={cards} />

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Production Analytics</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ProductionTrend />
          <AchievementTrend />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;