import ProductionEntry from "../../models/production.model.js";
import ConveyorStrength from "../../models/ConveyorStrength.model.js";
import { buildEntryQuery, buildStrengthFilter } from "./roleScope.util.js";

const sum = (arr, key) => arr.reduce((total, item) => total + Number(item[key] || 0), 0);

export const getSummary = async (user, filters = {}) => {
  try {
    const { query, daysInRange, effectiveConveyorId } = await buildEntryQuery(user, filters);
    const strengthFilter = buildStrengthFilter(user, filters, effectiveConveyorId);

    const [entries, strengths] = await Promise.all([
      ProductionEntry.find(query)
        .populate({ path: "productions.partId", select: "area partsPerHanger" })
        .lean(),
      ConveyorStrength.find(strengthFilter).lean(),
    ]);

    let production = 0;
    entries.forEach((entry) => { production += Number(entry.totalProductionQty || 0); });

    const target = strengths.reduce((s, item) => s + Number(item.demandPerShift || 0), 0) * daysInRange;
    const achievement = target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0;

    const rejectQty = sum(entries, "totalRejectQty");
    const reworkQty = sum(entries, "totalReworkQty");
    const rejectPercent = production > 0 ? Number(((rejectQty / production) * 100).toFixed(2)) : 0;
    const reworkPercent = production > 0 ? Number(((reworkQty / production) * 100).toFixed(2)) : 0;

    const goodProduction = production - rejectQty;
    const quality = production > 0 ? Number(((goodProduction / production) * 100).toFixed(2)) : 0;

    const downtime = sum(entries, "totalDowntime");
    const availableTime = strengths.reduce((s, item) => s + Number(item.availableTime || 0), 0) * daysInRange;
    const operatingTime = availableTime - downtime;
    const availability = availableTime > 0 ? Number(((operatingTime / availableTime) * 100).toFixed(2)) : 0;
    const performance = target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0;

    const shortManpower = sum(entries, "shortManpower");

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

    const oee = Number(((availability * performance * quality) / 10000).toFixed(2));
    const productionRate = operatingTime > 0 ? Number((production / (operatingTime / 60)).toFixed(2)) : 0;

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