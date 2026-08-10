import mongoose from "mongoose";
import ProductionEntry from "../../models/production.model.js";
import Model from "../../models/models.model.js"; // ⚠️ confirm this filename matches your project
import Part from "../../models/parts.model.js";
import { buildEntryQuery } from "./roleScope.util.js";

// Shared aggregation #1 — groups every production row across matching
// entries by modelId, sums productionQty, sorted descending. Feeds both
// getTopModels() and getModelProductionContribution().
const getModelBreakdown = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);

  const grouped = await ProductionEntry.aggregate([
    { $match: query },
    { $unwind: "$productions" },
    { $group: { _id: "$productions.modelId", quantity: { $sum: "$productions.productionQty" } } },
    { $sort: { quantity: -1 } },
  ]);

  const modelIds = grouped.map((g) => g._id).filter(Boolean);
  const models = await Model.find({ _id: { $in: modelIds } }).select("modelName").lean();
  const nameById = Object.fromEntries(models.map((m) => [String(m._id), m.modelName]));

  return grouped.map((g) => ({
    modelId: g._id ? String(g._id) : "unknown",
    modelName: g._id ? (nameById[String(g._id)] || "Unknown Model") : "Unspecified",
    quantity: g.quantity,
  }));
};

// Shared aggregation #2 — groups by partId, optionally scoped to one
// model. Feeds both getTopParts() (with modelId) and
// getPartPerformanceDistribution() (without — always full scope).
const getPartBreakdown = async (user, filters = {}, modelId = null) => {
  const { query } = await buildEntryQuery(user, filters);

  const pipeline = [{ $match: query }, { $unwind: "$productions" }];
  if (modelId) {
    pipeline.push({ $match: { "productions.modelId": new mongoose.Types.ObjectId(modelId) } });
  }
  pipeline.push(
    { $group: { _id: "$productions.partId", quantity: { $sum: "$productions.productionQty" }, modelId: { $first: "$productions.modelId" } } },
    { $sort: { quantity: -1 } }
  );

  const grouped = await ProductionEntry.aggregate(pipeline);

  const partIds = grouped.map((g) => g._id).filter(Boolean);
  const modelIds = [...new Set(grouped.map((g) => g.modelId).filter(Boolean).map(String))];

  const [parts, models] = await Promise.all([
    Part.find({ _id: { $in: partIds } }).select("partName").lean(),
    Model.find({ _id: { $in: modelIds } }).select("modelName").lean(),
  ]);

  const partNameById = Object.fromEntries(parts.map((p) => [String(p._id), p.partName]));
  const modelNameById = Object.fromEntries(models.map((m) => [String(m._id), m.modelName]));

  return grouped.map((g) => ({
    partId: g._id ? String(g._id) : "unknown",
    partName: g._id ? (partNameById[String(g._id)] || "Unknown Part") : "Unspecified",
    modelName: g.modelId ? (modelNameById[String(g.modelId)] || "") : "",
    quantity: g.quantity,
  }));
};

export const getTopModels = async (user, filters = {}) => {
  const breakdown = await getModelBreakdown(user, filters);
  return breakdown.slice(0, 10);
};

export const getTopParts = async (user, filters = {}, modelId = null) => {
  const breakdown = await getPartBreakdown(user, filters, modelId);
  return breakdown.slice(0, 10);
};

export const getModelProductionContribution = async (user, filters = {}) => {
  const breakdown = await getModelBreakdown(user, filters);
  const total = breakdown.reduce((s, m) => s + m.quantity, 0);

  const TOP_N = 6;
  const top = breakdown.slice(0, TOP_N);
  const rest = breakdown.slice(TOP_N);
  const restQty = rest.reduce((s, m) => s + m.quantity, 0);

  const models = top.map((m) => ({
    ...m,
    percentage: total > 0 ? Number(((m.quantity / total) * 100).toFixed(2)) : 0,
  }));

  if (restQty > 0) {
    models.push({
      modelId: "other",
      modelName: "Other",
      quantity: restQty,
      percentage: total > 0 ? Number(((restQty / total) * 100).toFixed(2)) : 0,
    });
  }

  return { total, models };
};

export const getPartPerformanceDistribution = async (user, filters = {}) => {
  return getPartBreakdown(user, filters, null);
};