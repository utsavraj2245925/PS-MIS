import React from "react";
import { Row, Col } from "antd";
import KPICard from "./KPICard";

const ExecutiveKPICards = ({ cards = {} }) => {
    const getColor = (value, type) => {

    if(type === "achievement"){
      if(value >= 95) return "#16a34a";
      if(value >= 80) return "#f59e0b";
      return "#ef4444";
    }

    if(type === "oee"){
      if(value >= 85) return "#16a34a";
      if(value >= 60) return "#f59e0b";
      return "#ef4444";
    }

    if(type === "quality"){
      if(value >= 98) return "#16a34a";
      if(value >= 95) return "#f59e0b";
      return "#ef4444";
    }

    if(type === "availability"){
      if(value >= 90) return "#16a34a";
      if(value >= 80) return "#f59e0b";
      return "#ef4444";
    }

    if(type === "reject"){
      if(value <= 2) return "#16a34a";
      if(value <= 5) return "#f59e0b";
      return "#ef4444";
    }

    if(type === "rework"){
      if(value <= 2) return "#16a34a";
      if(value <= 5) return "#f59e0b";
      return "#ef4444";
    }

    return "#1677ff";
  };
  
  const formatPaintedArea = (value) => {
    const area = Number(value || 0);

    if (area >= 1000000) {
      return `${(area / 1000000).toFixed(1)}M`;
    }

    if (area >= 1000) {
      return `${(area / 1000).toFixed(1)}K`;
    }

    return area.toFixed(1);
  };

  const commonCol = {
    xs: 24,
    sm: 12,
    md: 8,
    lg: 6,
    xl: 3,
  };

  return (
    <>
      {/* ROW 1 */}

      <Row gutter={[12, 12]}>
        <Col {...commonCol}>
          <KPICard
            title="Target"
            value={cards.target || 0}
            color="#722ed1"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Production"
            value={cards.production || 0}
            color="#1677ff"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
          title="Achievement %"
          value={cards.achievement || 0}
          color={getColor(cards.achievement,"achievement")}
          suffix="%"
          type="achievement"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Hanger Utilization %"
            value={cards.hangerUtilization || 0}
            suffix="%"
            color="#fa8c16"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="OEE"
            value={cards.oee || 0}
            suffix="%"
            color={getColor(cards.oee,"oee")}
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Quality"
            value={cards.quality || 0}
            suffix="%"
            color={getColor(cards.quality,"quality")}
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Availability"
            value={cards.availability || 0}
            suffix="%"
            color={getColor(cards.availability,"availability")}
          />
        </Col>
      </Row>

      {/* ROW 2 */}

      <Row
        gutter={[12, 12]}
        style={{ marginTop: 12 }}
      >
        <Col {...commonCol}>
          <KPICard
            title="Painted Area"
            value={formatPaintedArea(
              cards.paintedArea
            )}
            suffix=" m²"
            color="#52c41a"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Reject %"
            value={cards.rejectPercent || 0}
            suffix="%"
            color={getColor(cards.rejectPercent,"reject")}
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Rework %"
            value={cards.reworkPercent || 0}
            suffix="%"
            color={getColor(cards.reworkPercent,"rework")}
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Downtime"
            value={cards.downtime || 0}
            suffix=" min"
            color="#ff4d4f"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Performance %"
            value={cards.performance || 0}
            suffix="%"
            color="#722ed1"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Short Manpower"
            value={cards.shortManpower || 0}
            color="#ff4d4f"
          />
        </Col>

        <Col {...commonCol}>
          <KPICard
            title="Production Rate"
            value={cards.productionRate || 0}
            suffix="/hr"
            color="#1677ff"
          />
        </Col>
      </Row>
    </>
    
  );
  
};

export default ExecutiveKPICards;