import Plant from "../models/PlantModel.js";

const calculatePlantData = (data) => {
  const conveyorLength =
    Number(data.conveyorLength) || 0;

  const conveyorSpeed =
    Number(data.conveyorSpeed) || 0;

  const pitchDistance =
    Number(data.pitchDistance) || 0;

  const availableTime =
    Number(data.availableTime) || 630;

  const hangerEfficiency =
    Number(data.hangerEfficiency) || 100;

  // =====================================
  // TOTAL HANGERS
  // Formula:
  // Conveyor Length / Pitch Distance
  // =====================================

  const totalHangers =
    pitchDistance > 0
      ? Math.round(
          conveyorLength /
            pitchDistance
        )
      : 0;

  // =====================================
  // PROCESS TIME (MIN)
  // Formula:
  // Conveyor Length / Conveyor Speed
  // =====================================

  const processTime =
    conveyorSpeed > 0
      ? Number(
          (
            conveyorLength /
            conveyorSpeed
          ).toFixed(2)
        )
      : 0;

  // =====================================
  // TOTAL ROUNDS / SHIFT
  // Formula:
  // Available Time / Process Time
  // =====================================

  const totalRoundsShift =
    processTime > 0
      ? Number(
          (
            availableTime /
            processTime
          ).toFixed(2)
        )
      : 0;

  // =====================================
  // HANGER PER MINUTE
  // Formula:
  // Conveyor Speed / Pitch Distance
  // =====================================

  const hangerPerMinute =
    pitchDistance > 0
      ? Number(
          (
            conveyorSpeed /
            pitchDistance
          ).toFixed(2)
        )
      : 0;

  // =====================================
  // AVAILABLE HANGER / SHIFT
  // Formula:
  // Hanger Per Minute × Available Time
  // =====================================

  const availableHangerPerShift =
    Math.round(
      hangerPerMinute *
        availableTime
    ) || 0;

  // =====================================
  // EFFECTIVE HANGER / SHIFT
  // Formula:
  // Available Hanger × Efficiency %
  // =====================================

  const effectiveHangerPerShift =
    Math.round(
      availableHangerPerShift *
        (hangerEfficiency /
          100)
    ) || 0;

  return {
    ...data,

    totalHangers,

    processTime,

    totalRoundsShift,

    hangerPerMinute,

    availableHangerPerShift,

    effectiveHangerPerShift,
  };
};

export const createPlant =
  async (req, res) => {
    try {
      const existingPlant =
        await Plant.findOne({
          plantCode:
            req.body.plantCode,
        });

      if (existingPlant) {
        return res.status(400).json({
          message:
            "Plant Code already exists",
        });
      }

      const calculatedData =
        calculatePlantData(
          req.body
        );

      const plant =
        await Plant.create(
          calculatedData
        );

      return res
        .status(201)
        .json(plant);
    } catch (error) {
      return res.status(500).json({
        message:
          error.message,
      });
    }
  };

export const getPlants =
  async (req, res) => {
    try {
      const plants =
        await Plant.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json(
        plants
      );
    } catch (error) {
      return res.status(500).json({
        message:
          error.message,
      });
    }
  };

export const updatePlant =
  async (req, res) => {
    try {
      const existingPlant =
        await Plant.findById(
          req.params.id
        );

      if (
        !existingPlant
      ) {
        return res.status(404).json({
          message:
            "Plant not found",
        });
      }

      const calculatedData =
        calculatePlantData(
          req.body
        );

      const plant =
        await Plant.findByIdAndUpdate(
          req.params.id,
          calculatedData,
          {
            new: true,
            runValidators: true,
          }
        );

      return res.json(
        plant
      );
    } catch (error) {
      return res.status(500).json({
        message:
          error.message,
      });
    }
  };

export const deletePlant =
  async (req, res) => {
    try {
      await Plant.findByIdAndDelete(
        req.params.id
      );

      return res.json({
        message:
          "Plant Deleted",
      });
    } catch (error) {
      return res.status(500).json({
        message:
          error.message,
      });
    }
  };