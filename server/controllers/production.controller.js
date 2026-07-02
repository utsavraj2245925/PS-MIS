import ProductionEntry from "../models/production.model.js";
import User from "../models/users.model.js";

/* ========================= POPULATE CONFIG ========================= */

const POPULATE = [
  { path: "reportedBy", select: "name email role" },
  { path: "plantId", select: "plantName plantCode location" },
  { path: "productions.modelId", select: "modelName" },
  { path: "productions.partId", select: "partName area" },
  { path: "rejects.modelId", select: "modelName" },
  { path: "rejects.partId", select: "partName" },
  { path: "rejects.rejectTypeId", select: "name" },
  { path: "reworks.modelId", select: "modelName" },
  { path: "reworks.partId", select: "partName" },
  { path: "reworks.reworkTypeId", select: "name" },
  { path: "downtimes.downtimeTypeId", select: "name type" },
  { path: "consumables.materialId", select: "name type measurementType" },
];

/* ========================= HELPERS ========================= */

const sumBy = (arr = [], key) => arr.reduce((total, item) => total + Number(item[key] || 0), 0);

const minutesBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(Math.round((new Date(end) - new Date(start)) / 60000), 0);
};

const wordCount = (text = "") => text.trim().split(/\s+/).filter(Boolean).length;

/* ========================= CREATE ========================= */

export const createProductionEntry = async (req, res) => {
  try {
    const {
      reportedBy, shift, requiredManpower = 0, availableManpower = 0,
      productionEntries = [], rejects = [], reworks = [], downtimes = [], consumables = [],
      finalRemark = "", status = "Submitted",
    } = req.body;


    if (!reportedBy) return res.status(400).json({ success: false, message: "Reported By user is required" });
    if (!shift) return res.status(400).json({ success: false, message: "Shift is required" });
    if (!productionEntries.length) return res.status(400).json({ success: false, message: "Add at least one model to the production list" });

    const user = await User.findById(reportedBy).populate("plantId");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.plantId) return res.status(404).json({ success: false, message: "User has no plant assigned" });

    const plant = user.plantId; // already populated, no need to re-query

    for (const row of productionEntries) {
      if (!row.modelId || !row.partId) return res.status(400).json({ success: false, message: "Model and Part are required in every production row" });
    }
    for (const row of [...rejects, ...reworks]) {
      if (!row.modelId || !row.partId) return res.status(400).json({ success: false, message: "Model and Part are required in every reject/rework row" });
    }

    const formattedDowntimes = downtimes.map((item) => {
      if (item.type === "Unplanned" && wordCount(item.remark) > 10) {
        throw new Error("Unplanned downtime remark cannot exceed 10 words");
      }
      return { ...item, remark: item.type === "Unplanned" ? item.remark : "", duration: minutesBetween(item.startTime, item.endTime) };
    });

    const totalPlannedDowntime = sumBy(formattedDowntimes.filter((d) => d.type === "Planned"), "duration");
    const totalUnplannedDowntime = sumBy(formattedDowntimes.filter((d) => d.type === "Unplanned"), "duration");

    const totalRejectQty = sumBy(rejects, "quantity");
    const totalReworkQty = sumBy(reworks, "quantity");
    const totalProductionQty = sumBy(productionEntries, "productionQty") + totalReworkQty; // rework auto-counts into production
    const totalDefectQty = totalRejectQty + totalReworkQty;

    const newEntry = await ProductionEntry.create({
      reportedBy: user._id, employeeName: user.name, employeeEmail: user.email, role: user.role,
      plantId: plant._id, plantName: plant.plantName, location: plant.location,
      shift, reportTime: new Date(),
      requiredManpower, availableManpower, shortageManpower: Math.max(requiredManpower - availableManpower, 0),
      productionEntries, rejects, reworks, downtimes: formattedDowntimes,
      totalPlannedDowntime, totalUnplannedDowntime, totalDowntime: totalPlannedDowntime + totalUnplannedDowntime,
      consumables, totalProductionQty, totalRejectQty, totalReworkQty, totalDefectQty, finalRemark, status,
    });

    return res.status(201).json({ success: true, message: "Production entry created successfully", data: newEntry });
  } catch (error) {
    console.error("CREATE PRODUCTION ENTRY ERROR:", error);
    return res.status(error.message?.includes("word") ? 400 : 500).json({ success: false, message: error.message || "Failed to create production entry" });
  }
};

/* ========================= GET ALL ========================= */

export const getProductionEntries = async (req, res) => {
  try {
    const { plantId, shift, status, from, to } = req.query;

    const filter = {};
    if (plantId) filter.plantId = plantId;
    if (shift) filter.shift = shift;
    if (status) filter.status = status;
    if (from || to) filter.createdAt = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };

    const entries = await ProductionEntry.find(filter).populate(POPULATE).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, message: "Production entries fetched successfully", data: entries });
  } catch (error) {
    console.error("GET PRODUCTION ENTRIES ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch production entries" });
  }
};

/* ========================= GET SINGLE ========================= */

export const getSingleProductionEntry = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id).populate(POPULATE);
    if (!entry) return res.status(404).json({ success: false, message: "Production entry not found" });

    return res.status(200).json({ success: true, message: "Production entry fetched successfully", data: entry });
  } catch (error) {
    console.error("GET SINGLE PRODUCTION ENTRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch production entry" });
  }
};

/* ========================= UPDATE ========================= */

export const updateProductionEntry = async (req, res) => {
  try {
    const { productionEntries, rejects, reworks, downtimes, requiredManpower, availableManpower } = req.body;
    const patch = { ...req.body };

    if (rejects) patch.totalRejectQty = sumBy(rejects, "quantity");
    if (reworks) patch.totalReworkQty = sumBy(reworks, "quantity");
    if (productionEntries || reworks) {
      const existing = productionEntries ? null : await ProductionEntry.findById(req.params.id);
      const productionSum = productionEntries ? sumBy(productionEntries, "productionQty") : sumBy(existing?.productionEntries || [], "productionQty");
      const reworkSum = reworks ? sumBy(reworks, "quantity") : sumBy(existing?.reworks || [], "quantity");
      patch.totalProductionQty = productionSum + reworkSum;
    }
    if (rejects || reworks) {
      patch.totalDefectQty = (patch.totalRejectQty ?? 0) + (patch.totalReworkQty ?? 0);
    }

    if (downtimes) {
      const formatted = downtimes.map((d) => ({ ...d, duration: minutesBetween(d.startTime, d.endTime) }));
      patch.downtimes = formatted;
      patch.totalPlannedDowntime = sumBy(formatted.filter((d) => d.type === "Planned"), "duration");
      patch.totalUnplannedDowntime = sumBy(formatted.filter((d) => d.type === "Unplanned"), "duration");
      patch.totalDowntime = patch.totalPlannedDowntime + patch.totalUnplannedDowntime;
    }

    if (requiredManpower !== undefined || availableManpower !== undefined) {
      const existing = await ProductionEntry.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: "Production entry not found" });
      patch.shortageManpower = Math.max(
        Number(requiredManpower ?? existing.requiredManpower) - Number(availableManpower ?? existing.availableManpower), 0
      );
    }

    const updatedEntry = await ProductionEntry.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true }).populate(POPULATE);
    if (!updatedEntry) return res.status(404).json({ success: false, message: "Production entry not found" });

    return res.status(200).json({ success: true, message: "Production entry updated successfully", data: updatedEntry });
  } catch (error) {
    console.error("UPDATE PRODUCTION ENTRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update production entry" });
  }
};

/* ========================= DELETE ========================= */

export const deleteProductionEntry = async (req, res) => {
  try {
    const deletedEntry = await ProductionEntry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) return res.status(404).json({ success: false, message: "Production entry not found" });

    return res.status(200).json({ success: true, message: "Production entry deleted successfully" });
  } catch (error) {
    console.error("DELETE PRODUCTION ENTRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete production entry" });
  }
};