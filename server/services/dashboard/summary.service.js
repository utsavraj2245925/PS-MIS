import ProductionEntry from "../../models/production.model.js";
import Plant from "../../models/plants.model.js";
import Shift from "../../models/shift.model.js";
import Part from "../../models/parts.model.js";
import ConveyorStrength from "../../models/ConveyorStrength.model.js";

const sum = (arr, key) => arr.reduce((total, item) => total + Number(item[key] || 0), 0);

export const getSummary = async (user, filters = {}) => {
  try {
    const { fromDate, toDate, plantId, locationId, shiftId } = filters;

    // Always pull the raw ObjectId out of the populated doc — never pass
    // user.locationId / user.plantId / user.shiftId directly into a Mongo
    // filter, since verifyToken populates them into full documents.
    const userLocationId = user.locationId?._id || user.locationId || null;
    const userPlantId    = user.plantId?._id || user.plantId || null;
    const userShiftId    = user.shiftId?._id || user.shiftId || null;

    console.log("SUMMARY USER =", { role: user.role, locationId: userLocationId, plantId: userPlantId, shiftId: userShiftId });

    /* ============================== DATE FILTER ============================== */
    const query = {};
    if (fromDate || toDate) {
      query.entryDate = {};
      if (fromDate) query.entryDate.$gte = new Date(fromDate);
      if (toDate) query.entryDate.$lte = new Date(toDate);
    }

    /* ============================== ROLE BASED ACCESS ==============================
       ProductionEntry is only ever filtered by plantId/shiftId — never locationId,
       since older records don't reliably have it saved. Location scoping is always
       resolved to "which plants are under this location" first. */

    if (user.role === "user") {
      // fully pinned — no filter selection applies
      if (userPlantId) query.plantId = userPlantId;
      if (userShiftId) query.shiftId = userShiftId;
    }

    else if (user.role === "manager") {
      // pinned to own plant; shift is selectable among that plant's shifts
      if (userPlantId) query.plantId = userPlantId;
      if (shiftId) query.shiftId = shiftId;
    }

    else if (user.role === "plantAdmin") {
      // pinned to own location; plant + shift are selectable within it
      if (plantId) {
        query.plantId = plantId;
      } else if (userLocationId) {
        const plants = await Plant.find({ locationId: userLocationId }).select("_id").lean();
        query.plantId = { $in: plants.map((p) => p._id) };
      }
      if (shiftId) query.shiftId = shiftId;
    }

    else if (user.role === "superAdmin") {
      // fully open — everything comes from the selected filters
      if (plantId) {
        query.plantId = plantId;
      } else if (locationId) {
        const plants = await Plant.find({ locationId }).select("_id").lean();
        query.plantId = { $in: plants.map((p) => p._id) };
      }
      if (shiftId) query.shiftId = shiftId;
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
    }

    const strengths = await ConveyorStrength.find(strengthFilter).lean();
    console.log("CONVEYOR COUNT =", strengths.length);

    const target = strengths.reduce((sum, item) => sum + Number(item.demandPerShift || 0), 0);
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
    const availableTime = strengths.reduce((sum, item) => sum + Number(item.availableTime || 0), 0);
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

    const effectiveHangers = strengths.reduce((total, item) => total + Number(item.effectiveHangerPerShift || 0), 0);
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