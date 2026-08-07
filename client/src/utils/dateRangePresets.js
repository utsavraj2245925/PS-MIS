import dayjs from "dayjs";

/* Shared date-range presets — reused by the Dashboard's global filter bar
   and any future analytics section (Production Trend, OEE Trend, Quality
   Analysis, etc.) so every section stays in sync on the same date logic
   instead of each one reimplementing its own preset list. */
export const DATE_PRESETS = [
  {
    key: "today",
    label: "Today",
    range: () => [dayjs().startOf("day"), dayjs().endOf("day")],
  },
  {
    key: "yesterday",
    label: "Yesterday",
    range: () => [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
  },
  {
    key: "last7",
    label: "Last 7 Days",
    range: () => [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    key: "last30",
    label: "Last 30 Days",
    range: () => [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    key: "thisMonth",
    label: "This Month",
    range: () => [dayjs().startOf("month"), dayjs().endOf("month")],
  },
  {
    key: "lastMonth",
    label: "Last Month",
    range: () => [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ],
  },
  { key: "custom", label: "Custom Range", range: null },
];

export const getPresetRange = (key) => {
  const preset = DATE_PRESETS.find((p) => p.key === key);
  return preset?.range ? preset.range() : null;
};

export const rangeLabelFromPreset = (key, dateRange) => {
  const preset = DATE_PRESETS.find((p) => p.key === key);
  if (!preset) return "";
  if (key === "custom" && dateRange?.[0] && dateRange?.[1]) {
    return `${dateRange[0].format("DD MMM")} – ${dateRange[1].format("DD MMM YYYY")}`;
  }
  return preset.label;
};