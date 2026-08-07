import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import { Spin } from "antd";
import ExecutiveKPICards from "./components/ExecutiveKPICards";

const DashboardPage = () => {
  const { cards, loading } = useDashboard() || {};

  if (loading) return <Spin fullscreen />;

  return (
    <div className="space-y-4">
      <ExecutiveKPICards cards={cards} />
    </div>
  );
};

export default DashboardPage;