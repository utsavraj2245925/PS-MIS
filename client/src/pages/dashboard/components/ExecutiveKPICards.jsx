import React from "react";
import {
  Target, Package, Gauge, CheckCircle2, TrendingUp, Zap,
  Ruler, ShieldAlert, RotateCcw, Clock3, Users, Layers,
} from "lucide-react";
import KPICard from "./KPICard";

const getTone = (value, mode) => {
  const v = Number(value || 0);
  if (mode === "highIsGood") {
    if (v >= 90) return "green";
    if (v >= 75) return "amber";
    return "red";
  }
  if (mode === "lowIsGood") {
    if (v <= 3) return "green";
    if (v <= 8) return "amber";
    return "red";
  }
  return "slate";
};

const formatPaintedArea = (value) => {
  const area = Number(value || 0);
  if (area >= 1000000) return `${(area / 1000000).toFixed(1)}M`;
  if (area >= 1000) return `${(area / 1000).toFixed(1)}K`;
  return area.toFixed(1);
};

const ExecutiveKPICards = ({ cards = {} }) => {
  const items = [
    { icon: Target,        label: "Target",             value: (cards.target || 0).toLocaleString(),      tone: "teal" },
    { icon: Package,       label: "Produced",            value: (cards.production || 0).toLocaleString(),  tone: "blue" },
    { icon: Gauge,         label: "OEE",                 value: cards.oee || 0,          suffix: "%",      tone: getTone(cards.oee, "highIsGood") },
    { icon: Zap,           label: "Availability",        value: cards.availability || 0, suffix: "%",      tone: getTone(cards.availability, "highIsGood") },
    { icon: CheckCircle2,  label: "Quality",             value: cards.quality || 0,      suffix: "%",      tone: getTone(cards.quality, "highIsGood") },
    { icon: TrendingUp,    label: "Performance",         value: cards.performance || 0,  suffix: "%",      tone: getTone(cards.performance, "highIsGood") },
    { icon: Ruler,         label: "Painted Area",        value: formatPaintedArea(cards.paintedArea), suffix: ` ${cards.paintedAreaUnit || "m²"}`, tone: "cyan" },
    { icon: ShieldAlert,   label: "Reject",              value: cards.rejectPercent || 0, suffix: "%",     tone: getTone(cards.rejectPercent, "lowIsGood") },
    { icon: RotateCcw,     label: "Rework",              value: cards.reworkPercent || 0, suffix: "%",     tone: getTone(cards.reworkPercent, "lowIsGood") },
    { icon: Clock3,        label: "Downtime",            value: cards.downtime || 0,      suffix: " min",  tone: Number(cards.downtime) > 0 ? "amber" : "green" },
    { icon: Users,         label: "Short Manpower",      value: cards.shortManpower || 0, tone: Number(cards.shortManpower) > 0 ? "red" : "green" },
    { icon: TrendingUp,    label: "Production Rate",     value: cards.productionRate || 0, suffix: "/hr",  tone: "blue" },
    { icon: Layers,        label: "Hanger Utilization",  value: cards.hangerUtilization || 0, suffix: "%", tone: getTone(cards.hangerUtilization, "highIsGood") },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
      {items.map((item) => (
        <KPICard key={item.label} {...item} />
      ))}
    </div>
  );
};

export default ExecutiveKPICards;