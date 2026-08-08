import ProductionEntry from "../../models/production.model.js";
import Reject from "../../models/reject.model.js";
import { buildEntryQuery } from "./roleScope.util.js";

/* Shared aggregation — unwinds every entry's embedded rejects[] array
   (matching the same role-scoped query used by every other dashboard
   chart, so Shift/Conveyor filters work here too), groups by
   rejectTypeId, sums quantity, sorts descending. Both the donut and
   the Pareto chart are thin projections over this. */
const getDefectBreakdown = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);

  const grouped = await ProductionEntry.aggregate([
    { $match: query },
    { $unwind: "$rejects" },
    { $group: { _id: "$rejects.rejectTypeId", quantity: { $sum: "$rejects.quantity" } } },
    { $sort: { quantity: -1 } },
  ]);

  const rejectTypeIds = grouped.map((g) => g._id).filter(Boolean);
  const rejectTypes = await Reject.find({ _id: { $in: rejectTypeIds } }).select("name").lean();
  const nameById = Object.fromEntries(rejectTypes.map((r) => [String(r._id), r.name]));

  const total = grouped.reduce((sum, g) => sum + g.quantity, 0);

  return grouped.map((g) => ({
    defectId: g._id ? String(g._id) : "unknown",
    defectName: g._id ? (nameById[String(g._id)] || "Unknown") : "Unspecified",
    quantity: g.quantity,
    percentage: total > 0 ? Number(((g.quantity / total) * 100).toFixed(2)) : 0,
  }));
};

export const getDefectDistribution = async (user, filters = {}) => {
  return getDefectBreakdown(user, filters);
};

export const getDefectPareto = async (user, filters = {}) => {
  const breakdown = await getDefectBreakdown(user, filters); // already sorted descending
  let running = 0;
  return breakdown.map((item) => {
    running += item.percentage;
    return { ...item, cumulativePercent: Number(Math.min(running, 100).toFixed(2)) };
  });
};