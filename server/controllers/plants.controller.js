import Plant from "../models/plants.model.js";
import PlantStrength from "../models/plantStrength.model.js";

/* ── per-conveyor capacity calc ── */
const calculateConveyorMetrics = (c) => {
  const cLen   = Number(c.conveyorLength)   || 0;
  const cSpd   = Number(c.conveyorSpeed)    || 0;
  const pitch  = Number(c.pitchDistance)    || 0;
  const avail  = Number(c.availableTime)    || 0;
  const eff    = Number(c.hangerEfficiency) || 100;
  const demand = Number(c.demandPerShift)   || 0;

  const totalHangers            = pitch > 0 ? Math.round(cLen / pitch) : 0;
  const processTime             = cSpd  > 0 ? +(cLen / cSpd).toFixed(2) : 0;
  const totalRoundsShift        = processTime > 0 ? +(avail / processTime).toFixed(2) : 0;
  const hangerPerMinute         = pitch > 0 ? +(cSpd / pitch).toFixed(2) : 0;
  const availableHangerPerShift = Math.round(hangerPerMinute * avail) || 0;
  const effectiveHangerPerShift = Math.round(availableHangerPerShift * (eff / 100)) || 0;
  const taktTime                = demand > 0 ? +(avail / demand).toFixed(2) : 0;
  const estimatedProductionCapacity = effectiveHangerPerShift;

  return {
    totalHangers, processTime, totalRoundsShift, hangerPerMinute,
    availableHangerPerShift, effectiveHangerPerShift, taktTime, estimatedProductionCapacity,
  };
};

/* ── CREATE: plant + N conveyors in one shot ── */
export const createPlant = async (req, res) => {
  try {
    const { plantName, plantCode, location, plantAdmin, status, conveyors } = req.body;

    if (!plantName || !plantCode || !location || !plantAdmin)
      return res.status(400).json({ success: false, message: "All Required Fields Must Be Filled" });

    if (!Array.isArray(conveyors) || conveyors.length === 0)
      return res.status(400).json({ success: false, message: "At least one conveyor is required" });

    const existingPlant = await Plant.findOne({ plantCode });
    if (existingPlant)
      return res.status(400).json({ success: false, message: "Plant Code Already Exists" });

    const plant = await Plant.create({
      plantName,
      plantCode,
      location,
      plantAdmin,
      status: status || "Active",
      isActive: (status || "Active") === "Active",
    });

    const conveyorDocs = await PlantStrength.insertMany(
      conveyors.map((c) => ({
        plantId: plant._id,
        conveyorName: c.conveyorName,
        conveyorLength: c.conveyorLength,
        conveyorSpeed: c.conveyorSpeed,
        pitchDistance: c.pitchDistance,
        availableTime: c.availableTime,
        shiftsPerDay: c.shiftsPerDay,
        demandPerShift: c.demandPerShift,
        hangerEfficiency: c.hangerEfficiency,
        status: status || "Active",
        ...calculateConveyorMetrics(c),
      }))
    );

    return res.status(201).json({
      success: true,
      message: "Plant Created Successfully",
      plant: { ...plant.toObject(), conveyors: conveyorDocs },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ── UPDATE: replace conveyor set on edit ── */
export const updatePlant = async (req, res) => {
  try {
    const { plantName, plantCode, location, plantAdmin, status, conveyors } = req.body;

    const existingPlant = await Plant.findById(req.params.id);
    if (!existingPlant) return res.status(404).json({ success: false, message: "Plant Not Found" });

    if (plantCode && plantCode !== existingPlant.plantCode) {
      const duplicate = await Plant.findOne({ plantCode });
      if (duplicate) return res.status(400).json({ success: false, message: "Plant Code Already Exists" });
    }

    const updatedPlant = await Plant.findByIdAndUpdate(
      req.params.id,
      { plantName, plantCode, location, plantAdmin, status, isActive: status === "Active" },
      { new: true, runValidators: true }
    );

    let conveyorDocs = [];
    if (Array.isArray(conveyors)) {
      await PlantStrength.deleteMany({ plantId: updatedPlant._id });
      conveyorDocs = await PlantStrength.insertMany(
        conveyors.map((c) => ({
          plantId: updatedPlant._id,
          conveyorName: c.conveyorName,
          conveyorLength: c.conveyorLength,
          conveyorSpeed: c.conveyorSpeed,
          pitchDistance: c.pitchDistance,
          availableTime: c.availableTime,
          shiftsPerDay: c.shiftsPerDay,
          demandPerShift: c.demandPerShift,
          hangerEfficiency: c.hangerEfficiency,
          status: status || "Active",
          ...calculateConveyorMetrics(c),
        }))
      );
    }

    return res.status(200).json({
      success: true,
      message: "Plant Updated Successfully",
      plant: { ...updatedPlant.toObject(), conveyors: conveyorDocs },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ── DELETE: cascade conveyors ── */
export const deletePlant = async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) return res.status(404).json({ success: false, message: "Plant Not Found" });
    await PlantStrength.deleteMany({ plantId: req.params.id });
    return res.status(200).json({ success: true, message: "Plant Deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ── LIST: attach conveyors so frontend table/edit can use them ── */
export const getPlants = async (req, res) => {
  try {
    const plants = await Plant.find().sort("-createdAt").lean();
    const conveyors = await PlantStrength.find({
      plantId: { $in: plants.map((p) => p._id) },
    }).lean();

    const plantsWithConveyors = plants.map((p) => ({
      ...p,
      conveyors: conveyors.filter((c) => String(c.plantId) === String(p._id)),
    }));

    return res.status(200).json({ success: true, plants: plantsWithConveyors });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

