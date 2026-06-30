import mongoose from "mongoose";
import ProductionEntry from "../models/production.model.js";

// ======================================================
// CREATE ENTRY
// ======================================================

export const createProductionEntry = async (req, res) => {
  try {
    const body = req.body;

    if (!body.userId || !body.userName || !body.shift) {
      return res.status(400).json({
        success: false,
        message: "userId, userName and shift are required",
      });
    }

    if (!body.plantId || !body.modelId || !body.partId) {
      return res.status(400).json({
        success: false,
        message: "plantId, modelId and partId are required",
      });
    }

    // Auto-calc short manpower
    const requiredManpower = Number(body.requiredManpower) || 0;
    const availableManpower = Number(body.availableManpower) || 0;
    const shortManpower = Math.max(0, requiredManpower - availableManpower);

    // Auto-calc downtime totals (recompute on server, don't trust client blindly)
    const downtimes = Array.isArray(body.downtimes) ? body.downtimes : [];
    const totalPlannedDowntime = downtimes
      .filter((d) => d.type === "Planned")
      .reduce((sum, d) => sum + (Number(d.duration) || 0), 0);
    const totalUnplannedDowntime = downtimes
      .filter((d) => d.type === "Unplanned")
      .reduce((sum, d) => sum + (Number(d.duration) || 0), 0);
    const totalDowntime = totalPlannedDowntime + totalUnplannedDowntime;

    // Auto-calc rejected/rework qty from defects array if provided
    const defects = Array.isArray(body.defects) ? body.defects : [];
    const rejectedQty =
      defects
        .filter((d) => d.defectType === "Reject")
        .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0) ||
      Number(body.rejectedQty) ||
      0;
    const reworkQty =
      defects
        .filter((d) => d.defectType === "Rework")
        .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0) ||
      Number(body.reworkQty) ||
      0;

    const entry = new ProductionEntry({
      ...body,
      shortManpower,
      totalPlannedDowntime,
      totalUnplannedDowntime,
      totalDowntime,
      rejectedQty,
      reworkQty,
    });

    await entry.save();

    const populated = await ProductionEntry.findById(entry._id)
      .populate("plantId", "name")
      .populate("modelId", "name")
      .populate("partId", "name")
      .populate("userId", "name email");

    return res.status(201).json({
      success: true,
      message: "Production entry created successfully",
      data: populated,
    });
  } catch (error) {
    console.error("createProductionEntry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create production entry",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL ENTRIES (with optional filters)
// ======================================================

export const getAllProductionEntries = async (req, res) => {
  try {
    const {
      plantId,
      modelId,
      partId,
      shift,
      status,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};

    if (plantId && mongoose.Types.ObjectId.isValid(plantId)) {
      filter.plantId = plantId;
    }
    if (modelId && mongoose.Types.ObjectId.isValid(modelId)) {
      filter.modelId = modelId;
    }
    if (partId && mongoose.Types.ObjectId.isValid(partId)) {
      filter.partId = partId;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }
    if (shift) filter.shift = shift;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.reportTime = {};
      if (startDate) filter.reportTime.$gte = new Date(startDate);
      if (endDate) filter.reportTime.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const [entries, total] = await Promise.all([
      ProductionEntry.find(filter)
        .populate("plantId", "name")
        .populate("modelId", "name")
        .populate("partId", "name")
        .populate("userId", "name email")
        .sort({ reportTime: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ProductionEntry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: entries,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getAllProductionEntries error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch production entries",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE ENTRY
// ======================================================

export const getSingleProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entry id",
      });
    }

    const entry = await ProductionEntry.findById(id)
      .populate("plantId", "name")
      .populate("modelId", "name")
      .populate("partId", "name")
      .populate("userId", "name email")
      .populate("downtimes.downtimeTypeId", "name")
      .populate("consumables.materialId", "name");

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Production entry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error("getSingleProductionEntry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch production entry",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE ENTRY
// ======================================================

export const updateProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entry id",
      });
    }

    const existing = await ProductionEntry.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Production entry not found",
      });
    }

    const requiredManpower =
      body.requiredManpower !== undefined
        ? Number(body.requiredManpower)
        : existing.requiredManpower;
    const availableManpower =
      body.availableManpower !== undefined
        ? Number(body.availableManpower)
        : existing.availableManpower;
    const shortManpower = Math.max(0, requiredManpower - availableManpower);

    const downtimes = Array.isArray(body.downtimes)
      ? body.downtimes
      : existing.downtimes;
    const totalPlannedDowntime = downtimes
      .filter((d) => d.type === "Planned")
      .reduce((sum, d) => sum + (Number(d.duration) || 0), 0);
    const totalUnplannedDowntime = downtimes
      .filter((d) => d.type === "Unplanned")
      .reduce((sum, d) => sum + (Number(d.duration) || 0), 0);
    const totalDowntime = totalPlannedDowntime + totalUnplannedDowntime;

    const defects = Array.isArray(body.defects)
      ? body.defects
      : existing.defects;
    const rejectedQty = defects
      .filter((d) => d.defectType === "Reject")
      .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
    const reworkQty = defects
      .filter((d) => d.defectType === "Rework")
      .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

    const updated = await ProductionEntry.findByIdAndUpdate(
      id,
      {
        ...body,
        shortManpower,
        totalPlannedDowntime,
        totalUnplannedDowntime,
        totalDowntime,
        rejectedQty,
        reworkQty,
      },
      { new: true, runValidators: true }
    )
      .populate("plantId", "name")
      .populate("modelId", "name")
      .populate("partId", "name")
      .populate("userId", "name email");

    return res.status(200).json({
      success: true,
      message: "Production entry updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateProductionEntry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update production entry",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE ENTRY
// ======================================================

export const deleteProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entry id",
      });
    }

    const deleted = await ProductionEntry.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Production entry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Production entry deleted successfully",
    });
  } catch (error) {
    console.error("deleteProductionEntry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete production entry",
      error: error.message,
    });
  }
};