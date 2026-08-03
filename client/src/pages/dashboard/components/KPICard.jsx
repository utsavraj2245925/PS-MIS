import React from "react";
import { Card } from "antd";

const KPICard = ({
  title,
  value,
  suffix = "",
  color = "#1677ff",
}) => {
  return (
    <Card
    bodyStyle={{
        padding: "14px",
    }}
    style={{
        height: "100%",
        borderRadius: "14px",
    }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#888",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color,
        }}
      >
        {value}
        {suffix}
      </div>
    </Card>
  );
};

export default KPICard;