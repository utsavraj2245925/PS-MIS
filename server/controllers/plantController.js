import Plant from "../models/PlantModel.js";

export const createPlant = async (req, res) => {
  try {
    const existingPlant =
      await Plant.findOne({
        plantCode: req.body.plantCode,
      });

    if (existingPlant) {
      return res.status(400).json({
        message: "Plant Code already exists",
      });
    }

    const plant = await Plant.create(req.body);

    return res.status(201).json(plant);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getPlants = async (req, res) => {
  try {
    const plants = await Plant.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json(plants);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updatePlant = async (req, res) => {
  try {
    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.json(plant);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deletePlant = async (req, res) => {
  try {
    await Plant.findByIdAndDelete(
      req.params.id
    );

    return res.json({
      message: "Plant Deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};