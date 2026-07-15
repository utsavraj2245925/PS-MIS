import ModelPartTarget from "../models/modelPartTarget.model.js";

const POPULATE = [
  { path: "plantId", select: "plantName plantCode location" },
  { path: "modelId", select: "modelName" },
  { path: "partId", select: "partName area partsPerHanger" },
];

export const createModelPartTarget = async (req, res) => {
  try {
    const { plantId, modelId, partId, demandPerShift = 0, status = "Active" } = req.body;
    if (!plantId || !modelId || !partId)
      return res.status(400).json({ success: false, message: "Plant, Model and Part are required" });

    const existing = await ModelPartTarget.findOne({ plantId, modelId, partId });
    if (existing)
      return res.status(400).json({ success: false, message: "Target already exists for this Plant + Model + Part combination" });

    const target = await ModelPartTarget.create({ plantId, modelId, partId, demandPerShift, status });
    return res.status(201).json({ success: true, message: "Target created successfully", data: target });
  } catch (error) {
    console.error("CREATE MODEL PART TARGET ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create target" });
  }
};

export const getModelPartTargets = async (req, res) => {
  try {
    const { plantId, status } = req.query;
    const filter = {};
    if (plantId) filter.plantId = plantId;
    if (status) filter.status = status;

    const targets = await ModelPartTarget.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: targets });
  } catch (error) {
    console.error("GET MODEL PART TARGETS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch targets" });
  }
};

export const updateModelPartTarget = async (req, res) => {
  try {
    const updated = await ModelPartTarget.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(POPULATE);
    if (!updated) return res.status(404).json({ success: false, message: "Target not found" });
    return res.status(200).json({ success: true, message: "Target updated successfully", data: updated });
  } catch (error) {
    console.error("UPDATE MODEL PART TARGET ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update target" });
  }
};

export const deleteModelPartTarget = async (req, res) => {
  try {
    const deleted = await ModelPartTarget.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Target not found" });
    return res.status(200).json({ success: true, message: "Target deleted successfully" });
  } catch (error) {
    console.error("DELETE MODEL PART TARGET ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete target" });
  }
};