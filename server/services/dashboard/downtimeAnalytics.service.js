import ProductionEntry from "../../models/production.model.js";
import DowntimeType from "../../models/downtimeTypes.model.js"; // ⚠️ confirm this filename matches your project
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

const normalizeKey = (str = "") => str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

// Chart 1 — daily Planned/Unplanned/Total. Uses the already-proven
// top-level fields, no $unwind needed.
export const getDailyDowntimeSeries = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);
  const entries = await ProductionEntry.find(query)
    .select("entryDate totalPlannedDowntime totalUnplannedDowntime totalDowntime")
    .lean();

  const byDay = {};
  entries.forEach((e) => {
    const key = toDateKey(new Date(e.entryDate));
    if (!byDay[key]) byDay[key] = { planned: 0, unplanned: 0, total: 0 };
    byDay[key].planned += Math.max(Number(e.totalPlannedDowntime || 0), 0);
    byDay[key].unplanned += Math.max(Number(e.totalUnplannedDowntime || 0), 0);
    byDay[key].total += Math.max(Number(e.totalDowntime || 0), 0);
  });

  const dateList = buildDateList(filters.fromDate, filters.toDate);
  const days = dateList.length ? dateList : Object.keys(byDay).sort();

  return days.map((date) => ({
    date,
    planned: byDay[date]?.planned || 0,
    unplanned: byDay[date]?.unplanned || 0,
    total: byDay[date]?.total || 0,
  }));
};

// Chart 2 — whole-range Planned vs Unplanned split, with centered-total metadata.
export const getDowntimeTypeDistribution = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);
  const entries = await ProductionEntry.find(query)
    .select("totalPlannedDowntime totalUnplannedDowntime")
    .lean();

  let planned = 0, unplanned = 0;
  entries.forEach((e) => {
    planned += Math.max(Number(e.totalPlannedDowntime || 0), 0);
    unplanned += Math.max(Number(e.totalUnplannedDowntime || 0), 0);
  });
  const total = planned + unplanned;

  return {
    total,
    types: [
      { name: "Planned", minutes: planned, percentage: total > 0 ? Number(((planned / total) * 100).toFixed(2)) : 0 },
      { name: "Unplanned", minutes: unplanned, percentage: total > 0 ? Number(((unplanned / total) * 100).toFixed(2)) : 0 },
    ],
  };
};

// Shared aggregation for Charts 3 & 4 — groups downtimes[] by reason.
const getDowntimeReasonBreakdown = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);

  const grouped = await ProductionEntry.aggregate([
    { $match: query },
    { $unwind: "$downtimes" },
    { $match: { "downtimes.duration": { $gt: 0 } } }, // ignore invalid/negative/zero rows
    { $group: { _id: "$downtimes.downtimeTypeId", minutes: { $sum: "$downtimes.duration" } } },
    { $sort: { minutes: -1 } },
  ]);

  const typeIds = grouped.map((g) => g._id).filter(Boolean);
  const types = await DowntimeType.find({ _id: { $in: typeIds } }).select("name").lean();
  const nameById = Object.fromEntries(types.map((t) => [String(t._id), t.name]));

  // null downtimeTypeId = deliberate Auto Lunch Break case, labeled not
  // dropped. Only a NON-null id that fails to resolve is a genuine
  // stale reference and gets dropped.
  const merged = {};
  grouped.forEach((g) => {
    let name;
    if (!g._id) {
      name = "Lunch Break (Auto)";
    } else {
      const resolved = nameById[String(g._id)];
      if (!resolved) return;
      name = resolved;
    }
    const key = normalizeKey(name);
    if (!merged[key]) merged[key] = { name, minutes: 0 };
    merged[key].minutes += g.minutes;
  });

  return Object.values(merged).sort((a, b) => b.minutes - a.minutes);
};

const TOP_N = 10;

// Chart 3
export const getTopDowntimeReasons = async (user, filters = {}) => {
  const breakdown = await getDowntimeReasonBreakdown(user, filters);
  const top = breakdown.slice(0, TOP_N);
  const rest = breakdown.slice(TOP_N);
  const restMinutes = rest.reduce((s, r) => s + r.minutes, 0);
  if (restMinutes > 0) top.push({ name: "Other", minutes: restMinutes });
  return top;
};

// Chart 4 — reuses Chart 3's already-capped list, adds cumulative %.
export const getDowntimePareto = async (user, filters = {}) => {
  const reasons = await getTopDowntimeReasons(user, filters);
  const total = reasons.reduce((s, r) => s + r.minutes, 0);
  let running = 0;
  return reasons.map((r) => {
    running += r.minutes;
    return { ...r, cumulativePercent: total > 0 ? Number(Math.min((running / total) * 100, 100).toFixed(2)) : 0 };
  });
};