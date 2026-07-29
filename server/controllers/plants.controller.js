import mongoose from "mongoose";
import Plant from "../models/plants.model.js";
import Location from "../models/location.model.js";

/* ==========================================================
   HIERARCHY RULES (enforced below)
   ✔ One Location -> many Plants
   ✔ Same Plant Name allowed across DIFFERENT locations
   ✘ Same Plant Name NOT allowed twice within the SAME location
     (backed by the {locationId, plantName} unique index on the model,
      plus a friendly pre-check here so the error message is clean
      instead of a raw Mongo duplicate-key error)
   ✔ Same Conveyor Name allowed across different plants, and even
     across different plants within the SAME location
   ✘ Same Conveyor Name NOT allowed twice within the SAME plant
     (checked against the submitted conveyors[] array only —
      never against other plants)
========================================================== */

const findLocationOrCreate = async (locationName) => {
  const cleanName = locationName.trim();

  let location = await Location.findOne({
    locationName: { $regex: `^${cleanName}$`, $options: "i" },
  });

  if (!location) {
    const locationCode = cleanName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();

    location = await Location.create({
      locationName: cleanName.toUpperCase(),
      locationCode,
      status: "Active",
    });
  }

  return location;
};

const getDuplicateConveyorName = (conveyors) => {
  const seen = new Set();
  for (const c of conveyors) {
    const key = c.conveyorName.trim().toLowerCase();
    if (seen.has(key)) return c.conveyorName;
    seen.add(key);
  }
  return null;
};

/* ==========================================================
   CREATE PLANT
========================================================== */

export const createPlant = async (req, res) => {
  try {
    const { plantName, plantCode, locationName, conveyors, status } = req.body;

    if (!plantName || !plantCode || !locationName) {
      return res.status(400).json({
        success: false,
        message: "Plant Name, Plant Code and Location are required.",
      });
    }

    if (!Array.isArray(conveyors) || conveyors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one conveyor.",
      });
    }

    /* Conveyor names must only be unique WITHIN this plant */
    const duplicateName = getDuplicateConveyorName(conveyors);
    if (duplicateName) {
      return res.status(400).json({
        success: false,
        message: `Duplicate conveyor name "${duplicateName}" in this plant. Conveyor names must be unique within the same plant.`,
      });
    }

    /* Plant Code stays globally unique across the whole system */
    const duplicateCode = await Plant.findOne({
      plantCode: plantCode.trim().toUpperCase(),
    });
    if (duplicateCode) {
      return res.status(400).json({
        success: false,
        message: "Plant Code already exists.",
      });
    }

    const location = await findLocationOrCreate(locationName);

    /* Plant Name only needs to be unique WITHIN the same location */
    const duplicatePlantInLocation = await Plant.findOne({
      locationId: location._id,
      plantName: { $regex: `^${plantName.trim()}$`, $options: "i" },
    });
    if (duplicatePlantInLocation) {
      return res.status(400).json({
        success: false,
        message: `A plant named "${plantName}" already exists at ${location.locationName}.`,
      });
    }

    const plant = await Plant.create({
      plantName: plantName.trim(),
      plantCode: plantCode.trim().toUpperCase(),
      locationId: location._id,
      locationName: location.locationName,
      conveyors: conveyors.map((c) => ({
        conveyorName: c.conveyorName.trim(),
        status: c.status || "Active",
      })),
      status: status || "Active",
      isActive: (status || "Active") === "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Plant Created Successfully.",
      plant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   UPDATE PLANT
========================================================== */

export const updatePlant = async (req, res) => {
  try {
    const { plantName, plantCode, locationName, conveyors, status } = req.body;

    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found.",
      });
    }

    if (!Array.isArray(conveyors) || conveyors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one conveyor.",
      });
    }

    /* Conveyor names must only be unique WITHIN this plant */
    const duplicateName = getDuplicateConveyorName(conveyors);
    if (duplicateName) {
      return res.status(400).json({
        success: false,
        message: `Duplicate conveyor name "${duplicateName}" in this plant. Conveyor names must be unique within the same plant.`,
      });
    }

    /* Plant Code stays globally unique across the whole system */
    if (plantCode && plantCode.trim().toUpperCase() !== plant.plantCode) {
      const duplicateCode = await Plant.findOne({
        plantCode: plantCode.trim().toUpperCase(),
      });
      if (duplicateCode) {
        return res.status(400).json({
          success: false,
          message: "Plant Code already exists.",
        });
      }
    }

    const location = await findLocationOrCreate(locationName);

    /* Plant Name only needs to be unique WITHIN the same location (excluding itself) */
    const duplicatePlantInLocation = await Plant.findOne({
      _id: { $ne: plant._id },
      locationId: location._id,
      plantName: { $regex: `^${plantName.trim()}$`, $options: "i" },
    });
    if (duplicatePlantInLocation) {
      return res.status(400).json({
        success: false,
        message: `A plant named "${plantName}" already exists at ${location.locationName}.`,
      });
    }

    plant.plantName = plantName.trim();
    plant.plantCode = plantCode.trim().toUpperCase();
    plant.locationId = location._id;
    plant.locationName = location.locationName;
    plant.status = status;
    plant.isActive = status === "Active";
    plant.conveyors = conveyors.map((c) => ({
      conveyorName: c.conveyorName.trim(),
      status: c.status || "Active",
    }));

    await plant.save();

    return res.status(200).json({
      success: true,
      message: "Plant Updated Successfully.",
      plant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   DELETE PLANT (soft delete -> Inactive)
========================================================== */

export const deletePlant = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found.",
      });
    }

    plant.status = "Inactive";
    plant.isActive = false;
    await plant.save();

    return res.status(200).json({
      success: true,
      message: "Plant Deactivated Successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   PERMANENTLY DELETE PLANT (hard delete)
   For genuine mistakes (e.g. plant created by accident). Blocked if
   the plant already has ConveyorStrength configurations pointing at
   it, so real production setups can only be removed via deactivate.

   ⚠ VERIFY: I don't have your ConveyorStrength model's file path, so
   rather than guess an import that could crash this whole controller
   if wrong, I look the model up lazily via mongoose.models at request
   time. As long as any other file in your app imports that model
   (e.g. its own controller), this will find it. If it's never been
   registered for some reason, the guard is simply skipped rather than
   throwing — so deletion still works, just without that safety check.
========================================================== */

export const permanentDeletePlant = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found.",
      });
    }

    const ConveyorStrength = mongoose.models.ConveyorStrength;
    if (ConveyorStrength) {
      const linkedConfigCount = await ConveyorStrength.countDocuments({
        plantId: plant._id,
      });
      if (linkedConfigCount > 0) {
        return res.status(400).json({
          success: false,
          message: `This plant has ${linkedConfigCount} conveyor configuration(s) linked to it. Remove those first, or deactivate the plant instead of deleting it.`,
        });
      }
    }

    await Plant.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Plant Permanently Deleted.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   GET ALL PLANTS
========================================================== */

export const getPlants = async (req, res) => {
  try {
    const plants = await Plant.find()
      .populate("locationId", "locationName locationCode")
      .sort({ createdAt: -1 });

    const formattedPlants = plants.map((plant) => ({
      ...plant.toObject(),
      conveyorCount: plant.conveyors.length,
    }));

    return res.status(200).json({
      success: true,
      count: formattedPlants.length,
      plants: formattedPlants,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   GET PLANTS BY LOCATION
========================================================== */

export const getPlantsByLocation = async (req, res) => {
  try {
    const plants = await Plant.find({
      locationId: req.params.locationId,
      status: "Active",
    }).sort({ plantName: 1 });

    const formattedPlants = plants.map((plant) => ({
      ...plant.toObject(),
      conveyorCount: plant.conveyors.length,
    }));

    return res.status(200).json({
      success: true,
      count: formattedPlants.length,
      plants: formattedPlants,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   GET SINGLE PLANT
========================================================== */

export const getPlantById = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id).populate(
      "locationId",
      "locationName locationCode"
    );

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found.",
      });
    }

    return res.status(200).json({
      success: true,
      plant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};