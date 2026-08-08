import ProductionEntry from "../../models/production.model.js";
import ConveyorStrength from "../../models/ConveyorStrength.model.js";
import { buildEntryQuery, buildStrengthFilter } from "./roleScope.util.js";

const pad = (n) => String(n).padStart(2, "0");
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildDateList = (fromDate, toDate) => {
  const dates = [];
  if (!fromDate || !toDate) return dates;

  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const getDailySeries = async (user, filters = {}) => {
  const { fromDate, toDate } = filters;

  const { query, effectiveConveyorId } = await buildEntryQuery(user, filters);
  const strengthFilter = buildStrengthFilter(user, filters, effectiveConveyorId);

  const [entries, strengths] = await Promise.all([
    ProductionEntry.find(query).select("entryDate totalProductionQty totalDowntime totalRejectQty totalReworkQty").lean(),
    ConveyorStrength.find(strengthFilter).lean(),
  ]);

  const target = strengths.reduce((s, item) => s + Number(item.demandPerShift || 0), 0);
  const availableTimePerDay = strengths.reduce((s, item) => s + Number(item.availableTime || 0), 0);

  const productionByDay = {};
  const downtimeByDay = {};
  const rejectByDay = {};
  const reworkByDay = {};
  entries.forEach((entry) => {
    const key = toDateKey(new Date(entry.entryDate));
    productionByDay[key] = (productionByDay[key] || 0) + Number(entry.totalProductionQty || 0);
    downtimeByDay[key] = (downtimeByDay[key] || 0) + Number(entry.totalDowntime || 0);
    rejectByDay[key] = (rejectByDay[key] || 0) + Number(entry.totalRejectQty || 0);
    reworkByDay[key] = (reworkByDay[key] || 0) + Number(entry.totalReworkQty || 0);
  });

  const dateList = buildDateList(fromDate, toDate);
  const days = dateList.length ? dateList : Object.keys(productionByDay).sort();

  return days.map((date) => {
    const production = productionByDay[date] || 0;
    const downtime = downtimeByDay[date] || 0;
    const rejectQty = rejectByDay[date] || 0;
    const reworkQty = reworkByDay[date] || 0;

    const operatingTime = availableTimePerDay - downtime;
    const productionRate = operatingTime > 0 ? Number((production / (operatingTime / 60)).toFixed(2)) : 0;

    const availability = availableTimePerDay > 0 ? Number(((operatingTime / availableTimePerDay) * 100).toFixed(2)) : 0;
    const performance = target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0;
    const goodProduction = production - rejectQty;
    const quality = production > 0 ? Number(((goodProduction / production) * 100).toFixed(2)) : 0;
    const oee = Number(((availability * performance * quality) / 10000).toFixed(2));

    const rejectPercent = production > 0 ? Number(((rejectQty / production) * 100).toFixed(2)) : 0;
    const reworkPercent = production > 0 ? Number(((reworkQty / production) * 100).toFixed(2)) : 0;
    const ppm = production > 0 ? Math.round((rejectQty / production) * 1000000) : 0;
    const fpy = production > 0 ? Number((((production - rejectQty - reworkQty) / production) * 100).toFixed(2)) : 0;

    return {
      date, production, target, downtime, rejectQty, reworkQty, productionRate,
      availability, performance, quality, oee,
      rejectPercent, reworkPercent, ppm, fpy,
    };
  });
};

export const getProductionTrend = async (user, filters = {}) => getDailySeries(user, filters);

export const getAchievementTrend = async (user, filters = {}) => {
  const series = await getDailySeries(user, filters);
  return series.map(({ date, production, target }) => ({
    date,
    achievement: target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0,
  }));
};

export const getProductionRateTrend = async (user, filters = {}) => {
  const series = await getDailySeries(user, filters);
  return series.map(({ date, productionRate }) => ({ date, productionRate }));
};

export const getOEETrend = async (user, filters = {}) => {
  const series = await getDailySeries(user, filters);
  return series.map(({ date, oee, availability, performance, quality }) => ({
    date, oee, availability, performance, quality,
  }));
};

export const getQualityTrend = async (user, filters = {}) => {
  const series = await getDailySeries(user, filters);
  return series.map(({ date, rejectPercent, reworkPercent }) => ({ date, rejectPercent, reworkPercent }));
};

export const getQualityPerformanceTrend = async (user, filters = {}) => {
  const series = await getDailySeries(user, filters);
  return series.map(({ date, ppm, fpy }) => ({ date, ppm, fpy }));
};