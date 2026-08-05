import React from "react";
import { Card } from "antd";

const KPICard = ({
  title,
  value,
  suffix = "",
  type = "default",
}) => {

  const getColor = () => {

    const num = Number(value || 0);

    if (
      type === "achievement" ||
      type === "oee" ||
      type === "quality" ||
      type === "availability" ||
      type === "performance"
    ) {

      if (num >= 95) return "#16a34a";

      if (num >= 80) return "#f59e0b";

      return "#ef4444";
    }

    if (
      type === "reject" ||
      type === "rework" ||
      type === "downtime" ||
      type === "shortManpower"
    ) {

      if (num <= 5) return "#16a34a";

      if (num <= 15) return "#f59e0b";

      return "#ef4444";
    }

    return "#1677ff";
  };

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
        color : getColor(),
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {value}
      {suffix}
    </div>
    </Card>
  );
};

export default KPICard;