import mongoose from "mongoose";
import ProductionEntry from "../../models/production.model.js";
import Model from "../../models/models.model.js"; // ⚠️ confirm this filename matches your project
import Part from "../../models/parts.model.js";
import { buildEntryQuery } from "./roleScope.util.js";

// Stronger normalization than a plain trim/uppercase — strips ALL
// non-alphanumeric characters (spaces, hyphens, quotes) so genuinely
// identical names typed inconsistently ("SIDE-RH" vs "SIDE RH") merge
// into one entry. Names that differ by actual words ("Model 20" vs
// 'Model 20 "POLAR"') still stay separate since the extra letters
// remain in the key.
const normalizeKey = (name) => name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

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

  const mergedByName = {};
  grouped.forEach((g) => {
    const id = g._id ? String(g._id) : null;
    const name = id ? nameById[id] : null;
    if (!name) return; // model deleted / no longer exists in Model Master — drop it

    const key = normalizeKey(name);
    if (!mergedByName[key]) {
      mergedByName[key] = { modelId: id, modelName: name.trim(), quantity: 0 };
    }
    mergedByName[key].quantity += g.quantity;
  });

  return Object.values(mergedByName).sort((a, b) => b.quantity - a.quantity);
};

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

  const mergedByName = {};
  grouped.forEach((g) => {
    const partId = g._id ? String(g._id) : null;
    const partName = partId ? partNameById[partId] : null;
    if (!partName) return; // part deleted / no longer in Part Master — drop it

    const key = normalizeKey(partName);
    if (!mergedByName[key]) {
      mergedByName[key] = {
        partId,
        partName: partName.trim(),
        modelName: g.modelId ? (modelNameById[String(g.modelId)] || "") : "",
        quantity: 0,
      };
    }
    mergedByName[key].quantity += g.quantity;
  });

  return Object.values(mergedByName).sort((a, b) => b.quantity - a.quantity);
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

// Capped to top 14 + "Other" bucket — same pattern as the donut chart's
// top-6-plus-Other. Without a cap, a plant with 25+ distinct parts
// produces a wall of tiny, label-less rectangles that look broken
// rather than informative. This keeps every visible cell big enough
// to actually read.
export const getPartPerformanceDistribution = async (user, filters = {}) => {
  const breakdown = await getPartBreakdown(user, filters, null);

  const TOP_N = 14;
  const top = breakdown.slice(0, TOP_N);
  const rest = breakdown.slice(TOP_N);
  const restQty = rest.reduce((s, p) => s + p.quantity, 0);

  if (restQty > 0) {
    top.push({
      partId: "other",
      partName: `Other (${rest.length})`,
      modelName: "",
      quantity: restQty,
      isOther: true,
    });
  }

  return { parts: top, totalPartCount: breakdown.length };
};