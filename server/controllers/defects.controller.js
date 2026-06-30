import Defect from "../models/defects.model.js";

// maps the `type` field to which collection defectType points to
const typeModelMap = {
  reject: "Reject",
  rework: "Rework",
};

// CREATE
export const createDefect = async (req, res) => {
  try {
    const { defectedModel, defectedPart, defectedQnt, type, defectType, plantId } = req.body;

    if (!type || !typeModelMap[type]) {
      return res.status(400).json({ message: "type must be 'reject' or 'rework'" });
    }
    if (!defectType) {
      return res.status(400).json({ message: "defectType is required" });
    }

    const defect = await Defect.create({
      defectedModel,
      defectedPart,
      defectedQnt,
      type,
      defectType,
      defectTypeModel: typeModelMap[type],
      plantId,
    });

    return res.status(201).json({ message: "Defect entry created", data: defect });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create defect entry", error: error.message });
  }
};

// READ ALL — query: ?type=reject|rework, defectedModel, defectedPart, plantId
export const getAllDefects = async (req, res) => {
  try {
    const { type, defectedModel, defectedPart, plantId } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (defectedModel) filter.defectedModel = defectedModel;
    if (defectedPart) filter.defectedPart = defectedPart;
    if (plantId) filter.plantId = plantId;

    const defects = await Defect.find(filter)
      .populate("defectedModel", "name modelName")
      .populate("defectedPart", "name partName")
      .populate("defectType", "name") // resolves to Reject or Rework doc via refPath
      .populate("plantId", "name plantName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: defects });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch defect entries", error: error.message });
  }
};

// READ ONE
export const getDefectById = async (req, res) => {
  try {
    const { id } = req.params;
    const defect = await Defect.findById(id)
      .populate("defectedModel", "name modelName")
      .populate("defectedPart", "name partName")
      .populate("defectType", "name")
      .populate("plantId", "name plantName");

    if (!defect) {
      return res.status(404).json({ message: "Defect entry not found" });
    }

    return res.status(200).json({ data: defect });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch defect entry", error: error.message });
  }
};

// UPDATE
export const updateDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const { defectedModel, defectedPart, defectedQnt, type, defectType, plantId } = req.body;

    const updatePayload = {
      defectedModel,
      defectedPart,
      defectedQnt,
      plantId,
    };

    // if type changes, defectTypeModel must change with it to keep refPath valid
    if (type) {
      if (!typeModelMap[type]) {
        return res.status(400).json({ message: "type must be 'reject' or 'rework'" });
      }
      updatePayload.type = type;
      updatePayload.defectTypeModel = typeModelMap[type];
    }
    if (defectType) updatePayload.defectType = defectType;

    const updated = await Defect.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Defect entry not found" });
    }

    return res.status(200).json({ message: "Defect entry updated", data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update defect entry", error: error.message });
  }
};

// DELETE
export const deleteDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Defect.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Defect entry not found" });
    }

    return res.status(200).json({ message: "Defect entry deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete defect entry", error: error.message });
  }
};