import ProductionEntry from "../../models/production.model.js";
import { buildEntryQuery } from "./roleScope.util.js";

const pad = (n) => String(n).padStart(2, "0");
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildDateList = (fromDate, toDate) => {
  const dates = [];
  if (!fromDate || !toDate) return dates;
  const cursor = new Date(fromDate); cursor.setHours(0, 0, 0, 0);
  const end = new Date(toDate); end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

// Charts 1 & 2 — one shared daily series, two frontend projections
// (raw counts for the multi-line chart, utilization % for the area chart).
export const getManpowerDailySeries = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);
  const entries = await ProductionEntry.find(query)
    .select("entryDate requiredManpower availableManpower shortageManpower")
    .lean();

  const byDay = {};
  entries.forEach((e) => {
    const key = toDateKey(new Date(e.entryDate));
    if (!byDay[key]) byDay[key] = { required: 0, available: 0, short: 0 };
    byDay[key].required += Math.max(Number(e.requiredManpower || 0), 0);
    byDay[key].available += Math.max(Number(e.availableManpower || 0), 0);
    byDay[key].short += Math.max(Number(e.shortageManpower || 0), 0);
  });

  const dateList = buildDateList(filters.fromDate, filters.toDate);
  const days = dateList.length ? dateList : Object.keys(byDay).sort();

  return days.map((date) => {
    const d = byDay[date] || { required: 0, available: 0, short: 0 };
    const utilization = d.required > 0 ? Number(((d.available / d.required) * 100).toFixed(2)) : 0;
    return { date, required: d.required, available: d.available, short: d.short, utilization };
  });
};

// Chart 3 — 2-slice donut (Available + Short = Required, no double count).
export const getManpowerDistribution = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);
  const entries = await ProductionEntry.find(query)
    .select("requiredManpower availableManpower shortageManpower")
    .lean();

  let required = 0, available = 0, short = 0;
  entries.forEach((e) => {
    required += Math.max(Number(e.requiredManpower || 0), 0);
    available += Math.max(Number(e.availableManpower || 0), 0);
    short += Math.max(Number(e.shortageManpower || 0), 0);
  });

  return {
    required,
    parts: [
      { name: "Available", value: available, percentage: required > 0 ? Number(((available / required) * 100).toFixed(2)) : 0 },
      { name: "Short", value: short, percentage: required > 0 ? Number(((short / required) * 100).toFixed(2)) : 0 },
    ],
  };
};

// Chart 4 — no Master-data join needed, shiftName is already on the entry.
export const getManpowerShortageByShift = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);

  const grouped = await ProductionEntry.aggregate([
    { $match: query },
    { $group: {
        _id: "$shiftId",
        shiftName: { $first: "$shiftName" },
        short: { $sum: { $max: ["$shortageManpower", 0] } },
    } },
    { $sort: { short: -1 } },
  ]);

  return grouped.map((g) => ({
    shiftId: g._id ? String(g._id) : "unspecified",
    shiftName: g.shiftName || "Unspecified Shift",
    short: g.short,
  }));
};