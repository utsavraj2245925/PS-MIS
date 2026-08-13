import ProductionEntry from "../../models/production.model.js";
import Material from "../../models/material.model.js";
import { buildEntryQuery } from "./roleScope.util.js";

const normalizeKey = (str = "") => str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

// Shared aggregation — groups every consumable row across matching
// entries by materialId, sums quantity. Feeds all three consumption
// cards (Powder/Useful Items/Chemical), filtered by Material.type.
const getConsumableBreakdown = async (user, filters = {}) => {
  const { query } = await buildEntryQuery(user, filters);

  const grouped = await ProductionEntry.aggregate([
    { $match: query },
    { $unwind: "$consumables" },
    { $group: { _id: "$consumables.materialId", quantity: { $sum: "$consumables.quantity" } } },
  ]);

  const materialIds = grouped.map((g) => g._id).filter(Boolean);
  const materials = await Material.find({ _id: { $in: materialIds } })
    .select("name type mesurmentType")
    .lean();
  const materialById = Object.fromEntries(materials.map((m) => [String(m._id), m]));

  // Merge by normalized name (per Phase 4's lesson) so inconsistently
  // typed duplicate Material records don't produce separate rows for
  // what's really the same material, and drop anything that no longer
  // resolves to a real Material document.
  const merged = {};
  grouped.forEach((g) => {
    if (!g._id) return;
    const mat = materialById[String(g._id)];
    if (!mat) return; // stale/deleted reference — drop, don't show "Unknown"

    const key = `${mat.type}::${normalizeKey(mat.name)}`;
    if (!merged[key]) {
      merged[key] = { materialId: String(g._id), name: mat.name, type: mat.type, unit: mat.mesurmentType, quantity: 0 };
    }
    merged[key].quantity += g.quantity;
  });

  return Object.values(merged).sort((a, b) => b.quantity - a.quantity);
};

const buildTypeResponse = (breakdown, type, materialId) => {
  const ofType = breakdown.filter((m) => m.type === type);

  if (materialId) {
    const selected = ofType.find((m) => m.materialId === materialId);
    return {
      materials: ofType,
      selectedMaterialId: materialId,
      total: selected ? selected.quantity : 0,
      unit: selected?.unit || "",
    };
  }

  // "All" — sum everything of this type. Flag if units are mixed
  // (see section 0.6) rather than silently producing a misleading number.
  const total = ofType.reduce((s, m) => s + m.quantity, 0);
  const unitCounts = {};
  ofType.forEach((m) => { unitCounts[m.unit] = (unitCounts[m.unit] || 0) + m.quantity; });
  const units = Object.keys(unitCounts);
  const dominantUnit = units.sort((a, b) => unitCounts[b] - unitCounts[a])[0] || "";
  const mixedUnits = units.length > 1;

  return {
    materials: ofType.slice(0, 5), // top 5 for the breakdown list
    selectedMaterialId: null,
    total,
    unit: dominantUnit,
    mixedUnits,
    unitBreakdown: mixedUnits ? unitCounts : null,
  };
};

export const getPowderConsumption = async (user, filters = {}, materialId = null) => {
  const breakdown = await getConsumableBreakdown(user, filters);
  return buildTypeResponse(breakdown, "powderItems", materialId);
};

export const getUsefulItems = async (user, filters = {}, materialId = null) => {
  const breakdown = await getConsumableBreakdown(user, filters);
  return buildTypeResponse(breakdown, "usefulItems", materialId);
};

export const getChemicalConsumption = async (user, filters = {}, materialId = null) => {
  const breakdown = await getConsumableBreakdown(user, filters);
  return buildTypeResponse(breakdown, "chemicalItems", materialId);
};