import ProductionEntry from "../../models/production.model.js";
import Plant from "../../models/plants.model.js";
import Shift from "../../models/shift.model.js";
import Part from "../../models/parts.model.js";
import ConveyorStrength from "../../models/ConveyorStrength.model.js";
import User from "../../models/users.model.js";

const sum = (arr, key) => arr.reduce((total, item) => total + Number(item[key] || 0), 0);

export const getSummary = async (user, filters = {}) => {
  try {
    const { fromDate, toDate, plantId, locationId, shiftId, conveyorId } = filters;

    const userLocationId = user.locationId?._id || user.locationId || null;
    const userPlantId    = user.plantId?._id || user.plantId || null;
    const userShiftId    = user.shiftId?._id || user.shiftId || null;
    const userConveyorId = user.conveyorId?._id || user.conveyorId || null;

    console.log("SUMMARY USER =", {
      role: user.role,
      locationId: userLocationId,
      plantId: userPlantId,
      shiftId: userShiftId,
      conveyorId: userConveyorId,
    });

    /* ============================== DATE FILTER ==============================
       toDate is normalized to end-of-day (23:59:59.999) here as a safety
       net — even if a caller ever sends a bare date instead of a full
       start/end-of-day ISO timestamp, a same-day range (e.g. "Today")
       still includes every entry from that day instead of excluding
       anything created after midnight of whatever the raw timestamp was. */
        const query = {};
        if (fromDate || toDate) {
          query.entryDate = {};
          if (fromDate) {
            const start = new Date(fromDate);
            start.setHours(0, 0, 0, 0);
            query.entryDate.$gte = start;
          }
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            query.entryDate.$lte = end;
          }
        }

    /* ============================== DAYS IN RANGE ==============================
       ConveyorStrength's demandPerShift / availableTime / effectiveHangerPerShift
       are PER-SHIFT (one day's capacity) values, not totals — multiply by how
       many days the selected Date Range spans so Target (and anything derived
       from it) scales with the filter instead of always showing one day's worth. */
          let daysInRange = 1;
          if (fromDate && toDate) {
            const startDateOnly = new Date(fromDate); startDateOnly.setHours(0, 0, 0, 0);
            const endDateOnly = new Date(toDate); endDateOnly.setHours(0, 0, 0, 0);
            const diffDays = Math.round((endDateOnly - startDateOnly) / 86400000) + 1;
            daysInRange = Math.max(diffDays, 1);
          }

    /* ============================== ROLE BASED ACCESS ==============================
       ProductionEntry is only ever filtered by plantId/shiftId — never locationId,
       since older records don't reliably have it saved. Location scoping is always
       resolved to "which plants are under this location" first. */

    if (user.role === "user") {
      if (userPlantId) query.plantId = userPlantId;
      if (userShiftId) query.shiftId = userShiftId;
    }

    else if (user.role === "manager") {
      if (userPlantId) query.plantId = userPlantId;
      if (shiftId) query.shiftId = shiftId;
    }

    else if (user.role === "plantAdmin") {
      if (plantId) {
        query.plantId = plantId;
      } else if (userLocationId) {
        const plants = await Plant.find({ locationId: userLocationId }).select("_id").lean();
        query.plantId = { $in: plants.map((p) => p._id) };
      }
      if (shiftId) query.shiftId = shiftId;
    }

    else if (user.role === "superAdmin") {
      if (plantId) {
        query.plantId = plantId;
      } else if (locationId) {
        const plants = await Plant.find({ locationId }).select("_id").lean();
        query.plantId = { $in: plants.map((p) => p._id) };
      }
      if (shiftId) query.shiftId = shiftId;
    }

    /* ============================== CONVEYOR FILTER (ProductionEntry) ==============================
       ProductionEntry has no top-level conveyorId — entries are created by users assigned
       to a conveyor. Filter by reportedBy users matching the selected conveyor. */
    const effectiveConveyorId =
      user.role === "user" ? userConveyorId : (conveyorId || null);

    if (effectiveConveyorId) {
      const userFilter = { conveyorId: effectiveConveyorId, status: "Active", role: "user" };
      if (query.plantId) userFilter.plantId = query.plantId;

      const conveyorUsers = await User.find(userFilter).select("_id").lean();
      query.reportedBy = { $in: conveyorUsers.map((u) => u._id) };
    }

    /* ============================== FETCH DATA ============================== */
    console.log("FINAL PRODUCTION QUERY =", JSON.stringify(query, null, 2));
    const entries = await ProductionEntry.find(query)
      .populate({ path: "productions.partId", select: "area partsPerHanger" })
      .lean();

    console.log("ENTRIES FOUND =", entries.length);

    /* ============================== PRODUCTION ============================== */
    let production = 0;
    entries.forEach((entry) => {
      production += Number(entry.totalProductionQty || 0);
    });

    /* ============================== TARGET (ConveyorStrength) ==============================
       ConveyorStrength DOES store a real locationId/plantId/shiftId on every doc
       (set at creation via Manage Conveyor), so direct filtering here is safe —
       unlike ProductionEntry, no plant-list resolution is needed. */
    const strengthFilter = { status: "Active" };

    if (user.role === "manager") {
      if (userPlantId) strengthFilter.plantId = userPlantId;
      if (shiftId) strengthFilter.shiftId = shiftId;
    }

    else if (user.role === "plantAdmin") {
      if (plantId) strengthFilter.plantId = plantId;
      else if (userLocationId) strengthFilter.locationId = userLocationId;
      if (shiftId) strengthFilter.shiftId = shiftId;
    }

    else if (user.role === "superAdmin") {
      if (plantId) strengthFilter.plantId = plantId;
      else if (locationId) strengthFilter.locationId = locationId;
      if (shiftId) strengthFilter.shiftId = shiftId;
    }

    else if (user.role === "user") {
      if (userPlantId) strengthFilter.plantId = userPlantId;
      if (userShiftId) strengthFilter.shiftId = userShiftId;
      if (userConveyorId) strengthFilter.conveyorId = userConveyorId;
    }

    if (effectiveConveyorId && user.role !== "user") {
      strengthFilter.conveyorId = effectiveConveyorId;
    }

    const strengths = await ConveyorStrength.find(strengthFilter).lean();
    console.log("CONVEYOR COUNT =", strengths.length);

    const target = strengths.reduce((sum, item) => sum + Number(item.demandPerShift || 0), 0) * daysInRange;
    const achievement = target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0;

    /* ============================== REJECT / REWORK ============================== */
    const rejectQty = sum(entries, "totalRejectQty");
    const reworkQty = sum(entries, "totalReworkQty");
    const rejectPercent = production > 0 ? Number(((rejectQty / production) * 100).toFixed(2)) : 0;
    const reworkPercent = production > 0 ? Number(((reworkQty / production) * 100).toFixed(2)) : 0;

    /* ============================== QUALITY ============================== */
    const goodProduction = production - rejectQty;
    const quality = production > 0 ? Number(((goodProduction / production) * 100).toFixed(2)) : 0;

    /* ============================== DOWNTIME + PERFORMANCE ============================== */
    const downtime = sum(entries, "totalDowntime");
    const availableTime = strengths.reduce((sum, item) => sum + Number(item.availableTime || 0), 0) * daysInRange;
    const operatingTime = availableTime - downtime;
    const availability = availableTime > 0 ? Number(((operatingTime / availableTime) * 100).toFixed(2)) : 0;
    const performance = target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0;

    /* ============================== MANPOWER ============================== */
    const shortManpower = sum(entries, "shortManpower");

    /* ============================== PAINTED AREA ============================== */
    let paintedArea = 0;
    entries.forEach((entry) => {
      entry.productions?.forEach((row) => {
        const qty = Number(row.productionQty || 0);
        const areaMM2 = Number(row.partId?.area || 0);
        paintedArea += (qty * areaMM2) / 1000000;
      });
    });

    let paintedAreaDisplay = paintedArea;
    let paintedAreaUnit = "m²";
    if (paintedArea > 1000000) {
      paintedAreaDisplay = Number((paintedArea / 1000000).toFixed(2));
      paintedAreaUnit = "Million m²";
    }

    /* ============================== HANGER UTILIZATION ============================== */
    let usedHangers = 0;
    entries.forEach((entry) => {
      entry.productions?.forEach((row) => {
        const qty = Number(row.productionQty || 0);
        const partsPerHanger = Number(row.partId?.partsPerHanger || 1);
        usedHangers += qty / partsPerHanger;
      });
    });

    const effectiveHangers = strengths.reduce((total, item) => total + Number(item.effectiveHangerPerShift || 0), 0) * daysInRange;
    const hangerUtilization = effectiveHangers > 0 ? Number(((usedHangers / effectiveHangers) * 100).toFixed(2)) : 0;

    /* ============================== OEE ============================== */
    const oee = Number(((availability * performance * quality) / 10000).toFixed(2));

    /* ============================== PRODUCTION RATE ============================== */
    const productionRate = operatingTime > 0 ? Number((production / (operatingTime / 60)).toFixed(2)) : 0;

    /* ============================== RESPONSE ============================== */
    return {
      cards: {
        production, target, achievement,
        paintedArea: paintedAreaDisplay, paintedAreaUnit,
        hangerUtilization, oee, quality, availability,
        rejectPercent, reworkPercent, downtime, performance,
        shortManpower, productionRate,
      },
    };
  } catch (error) {
    console.error("SUMMARY SERVICE ERROR:", error);
    throw error;
  }
};