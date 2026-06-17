import Model from "../models/ModelModel.js";


// ======================
// CREATE MODEL
// ======================

export const createModel = async (req, res) => {
  try {
    const { modelName, modelCode, status } = req.body;

    if (!modelName || !modelCode) {
      return res.status(400).json({
        success: false,
        message: "Model Name and Model Code are required",
      });
    }

    const existingModel = await Model.findOne({
      modelName: modelName.trim(),
      modelCode: modelCode.trim(),
    });

    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: "Model already exists",
      });
    }

    const model = await Model.create({
      modelName,
      modelCode,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Model created successfully",
      data: model,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================
// GET ALL MODELS
// ======================

export const getModels = async (req, res) => {
  try {
    const models = await Model.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================
// UPDATE MODEL
// ======================

export const updateModel = async (req, res) => {
  try {
    const { id } = req.params;

    const { modelName, modelCode, status } = req.body;

    const duplicate = await Model.findOne({
      modelName,
      modelCode,
      _id: { $ne: id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Same model already exists",
      });
    }

    const updatedModel = await Model.findByIdAndUpdate(
      id,
      {
        modelName,
        modelCode,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedModel) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Model updated successfully",
      data: updatedModel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================
// DELETE MODEL
// ======================

export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedModel = await Model.findByIdAndDelete(id);

    if (!deletedModel) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Model deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================
// FILTER MODELS
// ======================

export const filterModels = async (req, res) => {
  try {
    const { search = "", status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        {
          modelName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          modelCode: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (status && status !== "All") {
      query.status = status;
    }

    const models = await Model.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};