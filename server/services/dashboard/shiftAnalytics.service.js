import ProductionEntry from "../../models/production.model.js";
import ConveyorStrength from "../../models/ConveyorStrength.model.js";
import { buildEntryQuery, buildStrengthFilter } from "./roleScope.util.js";

// Shared aggregation — feeds Charts 1, 3, 4 directly, and Chart 2 after
// joining with shift-level target/availableTime totals below.
const getShiftProductionBreakdown = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);

  const grouped = await ProductionEntry.aggregate([
    { $match: query },
    { $group: {
        _id: "$shiftId",
        shiftName: { $first: "$shiftName" },
        production: { $sum: "$totalProductionQty" },
        rejectQty: { $sum: "$totalRejectQty" },
        reworkQty: { $sum: "$totalReworkQty" },
        downtime: { $sum: "$totalDowntime" },
        plannedDowntime: { $sum: "$totalPlannedDowntime" },
        unplannedDowntime: { $sum: "$totalUnplannedDowntime" },
    } },
  ]);

  return grouped.map((g) => ({
    shiftId: g._id ? String(g._id) : "unspecified",
    shiftName: g.shiftName || "Unspecified Shift",
    production: Math.max(g.production || 0, 0),
    rejectQty: Math.max(g.rejectQty || 0, 0),
    reworkQty: Math.max(g.reworkQty || 0, 0),
    downtime: Math.max(g.downtime || 0, 0),
    plannedDowntime: Math.max(g.plannedDowntime || 0, 0),
    unplannedDowntime: Math.max(g.unplannedDowntime || 0, 0),
  }));
};

// Only Chart 2 needs this — target + available-time totals PER SHIFT,
// via ConveyorStrength (which stores these directly, unlike ProductionEntry).
const getShiftStrengthTotals = async (user, filters = {}) => {
  const userConveyorId = user.conveyorId?._id || user.conveyorId || null;
  const effectiveConveyorId = user.role === "user" ? userConveyorId : (filters.conveyorId || null);

  const strengthFilter = buildStrengthFilter(user, filters, effectiveConveyorId);

  const strengths = await ConveyorStrength.find(strengthFilter).lean();

  const byShift = {};
  strengths.forEach((s) => {
    const key = s.shiftId ? String(s.shiftId) : "unspecified";
    if (!byShift[key]) byShift[key] = { target: 0, availableTime: 0 };
    byShift[key].target += Number(s.demandPerShift || 0);
    byShift[key].availableTime += Number(s.availableTime || 0);
  });
  return byShift;
};

// Chart 1
export const getShiftProductionPerformance = async (user, filters = {}) => {
  const breakdown = await getShiftProductionBreakdown(user, filters);
  return breakdown
    .map((b) => ({ shiftId: b.shiftId, shiftName: b.shiftName, productionQty: b.production }))
    .sort((a, b) => b.productionQty - a.productionQty);
};

// Chart 2 — reuses the EXACT existing OEE formula, just per shift.
export const getShiftOEEPerformance = async (user, filters = {}) => {
  const [breakdown, strengthByShift] = await Promise.all([
    getShiftProductionBreakdown(user, filters),
    getShiftStrengthTotals(user, filters),
  ]);

  return breakdown
    .map((b) => {
      const s = strengthByShift[b.shiftId] || { target: 0, availableTime: 0 };
      const operatingTime = s.availableTime - b.downtime;
      const availability = s.availableTime > 0 ? Number(((operatingTime / s.availableTime) * 100).toFixed(2)) : 0;
      const performance = s.target > 0 ? Number(((b.production / s.target) * 100).toFixed(2)) : 0;
      const quality = b.production > 0 ? Number((((b.production - b.rejectQty) / b.production) * 100).toFixed(2)) : 0;
      const oee = Number(((availability * performance * quality) / 10000).toFixed(2));
      return { shiftId: b.shiftId, shiftName: b.shiftName, oee };
    })
    .sort((a, b) => b.oee - a.oee);
};

// Chart 3 — FPY uses the same formula Phase 3 established (subtracts
// BOTH reject and rework), not the OEE quality factor (reject only).
export const getShiftQualityPerformance = async (user, filters = {}) => {
  const breakdown = await getShiftProductionBreakdown(user, filters);
  return breakdown.map((b) => {
    const rejectPercent = b.production > 0 ? Number(((b.rejectQty / b.production) * 100).toFixed(2)) : 0;
    const reworkPercent = b.production > 0 ? Number(((b.reworkQty / b.production) * 100).toFixed(2)) : 0;
    const fpy = b.production > 0 ? Number((((b.production - b.rejectQty - b.reworkQty) / b.production) * 100).toFixed(2)) : 0;
    return { shiftId: b.shiftId, shiftName: b.shiftName, rejectPercent, reworkPercent, fpy };
  });
};

// Chart 4
export const getShiftDowntimePerformance = async (user, filters = {}) => {
  const breakdown = await getShiftProductionBreakdown(user, filters);
  return breakdown
    .map((b) => ({
      shiftId: b.shiftId, shiftName: b.shiftName,
      plannedDowntime: b.plannedDowntime, unplannedDowntime: b.unplannedDowntime,
      totalDowntime: b.downtime,
    }))
    .sort((a, b) => b.totalDowntime - a.totalDowntime);
};