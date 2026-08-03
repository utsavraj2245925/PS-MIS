import React from "react";
import { Row, Col } from "antd";
import KPICard from "./KPICard";

const ExecutiveKPICards = ({ cards }) => {
  return (
    <>
      {/* ROW 1 */}

      <Row gutter={[16,16]}>
        <Col span={3}>
          <KPICard
            title="Production"
            value={cards.production}
            color="#1677ff"
          />
          <Col xs={24}
        sm={12}
        md={8}
        lg={6}
        xl={3}></Col>
        </Col>

        <Col span={3}>
          <KPICard
            title="Target"
            value={cards.target}
            color="#722ed1"
          />
        </Col>

        <Col span={3}>
          <KPICard
            title="Achievement %"
            value={cards.achievement}
            suffix="%"
            color="#13c2c2"
          />
        </Col>

        <Col span={3}>
          <KPICard
            title="Painted Area"
            value={cards.paintedArea >= 1000000
                ? `${(cards.paintedArea / 1000000).toFixed(1)} M`
                : cards.paintedArea >= 1000
                ? `${(cards.paintedArea / 1000).toFixed(1)} K`
                : Number(cards.paintedArea || 0).toFixed(1)
            }
            suffix=" m²"
            color="#52c41a"
          />
        </Col>

        <Col span={3}> 
          <KPICard
            title="Hanger Utilization %"
            value={cards.hangerUtilization}
            suffix="%"
            color="#fa8c16"
          />
        </Col>

        <Col span={3}>
          <KPICard
            title="OEE"
            value={cards.oee}
            suffix="%"
            color="#1677ff"
          />
        </Col>

        <Col span={3}>
          <KPICard
            title="Quality"
            value={cards.quality}
            suffix="%"
            color="#52c41a"
          />
        </Col>

        <Col span={3}>
          <KPICard
            title="Availability"
            value={cards.availability}
            suffix="%"
            color="#13c2c2"
          />
        </Col>
      </Row>

      {/* ROW 2 */}

      <Row
        gutter={[12,12]}
        style={{ marginTop: 12 }}
      >
        <Col span={4}>
          <KPICard
            title="Reject %"
            value={cards.rejectPercent}
            suffix="%"
            color="#ff4d4f"
          />
        </Col>

        <Col span={4}>
          <KPICard
            title="Rework %"
            value={cards.reworkPercent}
            suffix="%"
            color="#faad14"
          />
        </Col>

        <Col span={4}>
          <KPICard
            title="Downtime"
            value={cards.downtime}
            suffix=" min"
            color="#ff4d4f"
          />
        </Col>

        <Col span={4}>
          <KPICard
            title="Paint Usage"
            value={cards.paintUsage}
            suffix=" kg"
            color="#722ed1"
          />
        </Col>

        <Col span={4}>
          <KPICard
            title="Short Manpower"
            value={cards.shortManpower}
            color="#ff4d4f"
          />
        </Col>

        <Col span={4}>
          <KPICard
            title="Production Rate"
            value={cards.productionRate}
            suffix="/hr"
            color="#1677ff"
          />
        </Col>
      </Row>
    </>
  );
};

export default ExecutiveKPICards;