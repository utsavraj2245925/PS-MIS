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
    ProductionEntry.find(query).select("entryDate totalProductionQty").lean(),
    ConveyorStrength.find(strengthFilter).lean(),
  ]);

  // per-day target — NOT multiplied by daysInRange, each point = 1 day
  const target = strengths.reduce((s, item) => s + Number(item.demandPerShift || 0), 0);

  const productionByDay = {};
  entries.forEach((entry) => {
    const key = toDateKey(new Date(entry.entryDate));
    productionByDay[key] = (productionByDay[key] || 0) + Number(entry.totalProductionQty || 0);
  });

  const dateList = buildDateList(fromDate, toDate);
  const days = dateList.length ? dateList : Object.keys(productionByDay).sort();

  return days.map((date) => ({
    date,
    production: productionByDay[date] || 0,
    target,
  }));
};

export const getProductionTrend = async (user, filters = {}) => getDailySeries(user, filters);

export const getAchievementTrend = async (user, filters = {}) => {
  const series = await getDailySeries(user, filters);
  return series.map(({ date, production, target }) => ({
    date,
    achievement: target > 0 ? Number(((production / target) * 100).toFixed(2)) : 0,
  }));
};