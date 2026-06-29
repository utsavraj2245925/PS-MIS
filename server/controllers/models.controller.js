import mongoose from "mongoose";
import Model from "../models/models.model.js";
import Part  from "../models/parts.model.js";
import Plant from "../models/plants.model.js";

// ── helpers ───────────────────────────────────────────────────────────────────

const isValidId = (id)        => mongoose.Types.ObjectId.isValid(id);
const ok        = (res, s, d) => res.status(s).json({ success: true,  ...d });
const fail      = (res, s, m) => res.status(s).json({ success: false, message: m });
const serverErr = (res, err)  => (console.error(err), fail(res, 500, err.message));

const PLANT_SELECT = "plantName plantCode location";


export const createModel = async (req, res) => {
  try {
    const { modelName } = req.body;

    if (!modelName?.trim())
      return fail(res, 400, "Model name is required");

  

    const existing = await Model.findOne({ modelName: modelName.trim() });

    if (existing) return fail(res, 400, "A model with this name already exists in your plant");

    const model = await Model.create({ modelName: modelName.trim() });

    const populated = await Model.findById(model._id).lean();

    return ok(res, 201, { message: "Model created successfully", model: populated });

  } catch (error) { return serverErr(res, error); }
};

// ── GET ALL ───────────────────────────────────────────────────────────────────
//  Returns only models belonging to the logged-in user's plant

export const getModels = async (req, res) => {
  try {
    const models = await Model.find().sort({ createdAt: -1 }).lean();
    return ok(res, 200, { count: models.length, models });
  } catch (error) { 
    return serverErr(res, error); 
  }
};

// ── GET SINGLE ────────────────────────────────────────────────────────────────

export const getSingleModel = async (req, res) => {
  try {

    const model = await Model.findOne({ _id: id, }).lean();

    if (!model)
      return fail(res, 404, "Model not found");

    return ok(res, 200, { model });

  } catch (error) { return serverErr(res, error); }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
//  Only modelName can be updated.
//  plantId is never touched.

export const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { modelName } = req.body;

    if (!modelName?.trim())
      return fail(res, 400, "Model name is required");

   
    const existing = await Model.findOne({ _id: id });
    if (!existing)
      return fail(res, 404, "Model not found");

    // Check duplicate name within same plant (excluding self)
    const duplicate = await Model.findOne({
      modelName: modelName.trim(),
      _id: { $ne: id },
    });
    if (duplicate)
      return fail(res, 400, "A model with this name already exists in your plant");

    const updatedModel = await  Model.findByIdAndUpdate(id,
        { modelName: modelName.trim() },   // only modelName — nothing else
        { new: true, runValidators: true }
      ).lean();

    return ok(res, 200, { message: "Model updated successfully", updatedModel });

  } catch (error) { return serverErr(res, error); }
};

// ── DELETE ────────────────────────────────────────────────────────────────────
//  Also deletes all Parts that reference this model

export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

  
    const model = await Model.findOne({ _id: id, });
    if (!model)
      return fail(res, 404, "Model not found");

    await Promise.all([
      Part.deleteMany({ modelId: model._id }),  // cascade delete parts
      Model.findByIdAndDelete(id),
    ]);

    return ok(res, 200, { message: "Model deleted successfully" });

  } catch (error) { return serverErr(res, error); }
};

// ── FILTER ────────────────────────────────────────────────────────────────────
//  Searches by modelName only, always scoped to the user's plant

export const filterModels = async (req, res) => {
  try {
    const { plantId, error } = await resolveUserPlantId(req, res);
    if (error) return error;

    const { modelName, status } = req.query;

    const filter = { plantId };

    if (modelName) filter.modelName = { $regex: modelName, $options: "i" };
    if (status)    filter.status    = status;

    const models = await  Model.find(filter).sort({ createdAt: -1 }).lean();

    return ok(res, 200, { count: models.length, models });

  } catch (error) { return serverErr(res, error); }
};