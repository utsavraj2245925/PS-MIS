import mongoose from "mongoose";
import Part  from "../models/parts.model.js";
import Model from "../models/models.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const regex     = (val) => ({ $regex: val, $options: "i" });
const ok        = (res, status, data) => res.status(status).json({ success: true, ...data });
const fail      = (res, status, msg)  => res.status(status).json({ success: false, message: msg });
const serverErr = (res, error) => (console.log(error), fail(res, 500, error.message));

// ── CREATE ──────────────────────────────────────────
export const createPart = async (req, res) => {
  try {
    const { modelId, partName, area, partsPerHanger, status } = req.body;

    if (!isValidId(modelId)) return fail(res, 400, "Invalid Model ID");

    const modelExists = await Model.findById(modelId);
    if (!modelExists) return fail(res, 404, "Model not found");

    const part = await Part.create({ modelId, partName, area, partsPerHanger, status });

    return ok(res, 201, { message: "Part Created Successfully", part });
  } catch (error) { return serverErr(res, error); }
};

// ── GET ALL ─────────────────────────────────────────
export const getParts = async (req, res) => {
  try {
    const parts = await Part.find()
      .populate("modelId", "modelName")
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, 200, { count: parts.length, parts });
  } catch (error) { return serverErr(res, error); }
};

export const getPartsByModel = async (req, res) => {
  try {
    const { modelId } = req.params;

    if (!isValidId(modelId)) return fail(res, 400, "Invalid Model ID");

    const parts = await Part.find({ modelId })
      .populate("modelId", "modelName")
      .sort({ createdAt: -1 })
      .lean();
      
    return ok(res, 200, { count: parts.length, parts });
  } catch (error) { return serverErr(res, error); }
}


// ── GET SINGLE ──────────────────────────────────────
export const getSinglePart = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return fail(res, 400, "Invalid Part ID");

    const part = await Part.findById(id).populate("modelId", "modelName").lean();
    if (!part) return fail(res, 404, "Part not found");

    return ok(res, 200, { part });
  } catch (error) { return serverErr(res, error); }
};

// ── UPDATE ──────────────────────────────────────────
export const updatePart = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return fail(res, 400, "Invalid Part ID");

    const existingPart = await Part.findById(id);
    if (!existingPart) return fail(res, 404, "Part not found");

    if (req.body.modelId && !isValidId(req.body.modelId)) {
      return fail(res, 400, "Invalid Model ID");
    }

    if (req.body.modelId) {
      const newModel = await Model.findById(req.body.modelId);
      if (!newModel) return fail(res, 404, "New Model not found");
    }

    const updatedPart = await Part.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("modelId", "modelName");

    return ok(res, 200, { message: "Part Updated Successfully", updatedPart });
  } catch (error) { return serverErr(res, error); }
};

// ── DELETE ──────────────────────────────────────────
export const deletePart = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return fail(res, 400, "Invalid Part ID");

    const part = await Part.findByIdAndDelete(id);
    if (!part) return fail(res, 404, "Part not found");

    return ok(res, 200, { message: "Part Deleted Successfully" });
  } catch (error) { return serverErr(res, error); }
};

// ── FILTER ──────────────────────────────────────────
export const getFilterParts = async (req, res) => {
  try {
    const { modelId, partName, status } = req.query;

    const filter = {};
    if (modelId && isValidId(modelId)) filter.modelId = modelId;
    if (partName) filter.partName = regex(partName);
    if (status)   filter.status   = status;

    const parts = await Part.find(filter)
      .populate("modelId", "modelName")
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, 200, { count: parts.length, parts });
  } catch (error) { return serverErr(res, error); }
};