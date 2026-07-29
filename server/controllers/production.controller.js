import ProductionEntry from "../models/production.model.js";
import User from "../models/users.model.js";
import ConveyorStrength from "../models/ConveyorStrength.model.js";
import Plant from "../models/plants.model.js";
import model from "../models/models.model.js";
import part from "../models/parts.model.js";
import reject from "../models/reject.model.js";
import rework from "../models/rework.model.js";
import downtime from "../models/downTime.model.js";
import downtimeType from "../models/downtimeTypes.model.js";
import consumable from "../models/consumable.model.js";
import shift from "../models/shift.model.js";
import defect from "../models/defects.model.js";
import material from "../models/material.model.js";


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
  { path: "productions.conveyorId", select: "conveyorName" },
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
      productions = [], rejects = [], reworks = [], downtimes = [], consumables = [],
      finalRemark = "", status = "Submitted",
    } = req.body;


    if (!reportedBy) return res.status(400).json({ success: false, message: "Reported By user is required" });
    if (!shift) return res.status(400).json({ success: false, message: "Shift is required" });
    if (!productions.length) return res.status(400).json({ success: false, message: "Add at least one model to the production list" });

    const user = await User.findById(reportedBy).populate("plantId");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.plantId) return res.status(404).json({ success: false, message: "User has no plant assigned" });

    const plant = user.plantId; // already populated, no need to re-query

    for (const row of productions) {
      if (!row.modelId || !row.partId) return res.status(400).json({ success: false, message: "Model and Part are required in every production row" });
    }
    for (const row of [...rejects, ...reworks]) {
      if (!row.modelId || !row.partId) return res.status(400).json({ success: false, message: "Model and Part are required in every reject/rework row" });
    }

     // Each production row can now say exactly which line (conveyorId) it was produced
    // on. That line's own demandPerShift becomes the row's target. Rows without a
    // conveyorId (legacy free-form entries) fall back to a plantId+modelId+partId match.
    const enrichedProductions = await Promise.all(
      productions.map(async (row) => {
        const strength = row.conveyorId
          ? await PlantStrength.findById(row.conveyorId).lean()
          : await PlantStrength.findOne({ plantId: plant._id, modelId: row.modelId, partId: row.partId }).lean();
        const demand = strength?.demandPerShift ?? 0;
        return {
          ...row,
          demandPerShift: demand,
          achievementPercent: demand > 0
            ? parseFloat(((row.productionQty / demand) * 100).toFixed(2))
            : 0,
        };
      })
    );


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
    const totalProductionQty = sumBy(enrichedProductions, "productionQty") + totalReworkQty; // rework auto-counts into production
    const totalDefectQty = totalRejectQty + totalReworkQty;

    // shift-level target vs achieved — sum of the specific lines actually used in this entry
    const totalTarget = sumBy(enrichedProductions, "demandPerShift");
    const totalAchieved = sumBy(enrichedProductions, "productionQty");
    const shiftSummary = {
      target: totalTarget,
      achieved: totalAchieved,
      achievement: totalTarget > 0 ? parseFloat(((totalAchieved / totalTarget) * 100).toFixed(2)) : 0,
    };

    const newEntry = await ProductionEntry.create({
      reportedBy: user._id, employeeName: user.name, employeeEmail: user.email, role: user.role,
      entryDate:  new Date(new Date().toISOString().slice(0, 10)),
      plantId: plant._id, plantName: plant.plantName, location: plant.location,
      shift, reportTime: new Date(),
      requiredManpower, availableManpower, shortageManpower: Math.max(requiredManpower - availableManpower, 0),
      productions: enrichedProductions, rejects, reworks, downtimes: formattedDowntimes,
      totalPlannedDowntime, totalUnplannedDowntime, totalDowntime: totalPlannedDowntime + totalUnplannedDowntime,
      consumables, totalProductionQty, totalRejectQty, totalReworkQty, totalDefectQty, finalRemark, shiftSummary,
    });

    return res.status(201).json({ success: true, message: "Production entry created successfully", data: newEntry });
  } catch (error) {
    console.error("CREATE PRODUCTION ENTRY ERROR:", error);
    return res.status(error.message?.includes("word") ? 400 : 500).json({ success: false, message: error.message || "Failed to create production entry" });
  }
};

/* ========================= GET ALL ========================= */

export const getproductions = async (req, res) => {
  try {
    const {  shift,  from, to } = req.query;
    console.log("GET PRODUCTION ENTRIES REQUEST:", {  shift, from, to });

    const user = await User.findById(req.user.id);
    const plantId = user?.plantId;
    console.log("Authenticated user:", req.user.id, "Plant ID:", plantId);

   const filter = {};
    if (plantId) filter.plantId = plantId;
    if (shift) filter.shift = shift;
    if (from || to) {
      filter.entryDate = {};
      if (from) filter.entryDate.$gte = new Date(from);
      if (to)   filter.entryDate.$lte = new Date(to);
    }

    const entries = await ProductionEntry.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    const plantStrengths = plantId
      ? await PlantStrength.find({ plantId, status: "Active" })
          .populate("modelId", "modelName")
          .populate("partId", "partName")
      : [];

    return res.status(200).json({ success: true, message: "Production entries fetched successfully", data: entries, plantStrengths });
  } catch (error) {
    console.error("GET PRODUCTION ENTRIES ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch production entries" });
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
    const { productions, rejects, reworks, downtimes, requiredManpower, availableManpower } = req.body;
    const patch = { ...req.body };

    if (rejects) patch.totalRejectQty = sumBy(rejects, "quantity");
    if (reworks) patch.totalReworkQty = sumBy(reworks, "quantity");
    if (productions || reworks) {
      const existing = productions ? null : await ProductionEntry.findById(req.params.id);
      const productionSum = productions ? sumBy(productions, "productionQty") : sumBy(existing?.productions || [], "productionQty");
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