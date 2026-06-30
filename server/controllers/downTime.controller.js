import DowntimeTypes from "../models/downtimeTypes.model.js";

const VALID_TYPES = ["Planned", "Unplanned"];

// CREATE
export const createDowntimeType = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "name and type are required" });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const exists = await DowntimeTypes.findOne({ name: name.trim(), type });
    if (exists) {
      return res.status(409).json({ message: "This downtime type already exists" });
    }

    const downtimeType = await DowntimeTypes.create({ name: name.trim(), type });
    return res.status(201).json({ message: "Downtime type created", data: downtimeType });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create downtime type", error: error.message });
  }
};

// READ ALL — query: ?type=Planned|Unplanned
export const getAllDowntimeTypes = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const downtimeTypes = await DowntimeTypes.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ data: downtimeTypes });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch downtime types", error: error.message });
  }
};

// READ ONE
export const getDowntimeTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const downtimeType = await DowntimeTypes.findById(id);

    if (!downtimeType) {
      return res.status(404).json({ message: "Downtime type not found" });
    }

    return res.status(200).json({ data: downtimeType });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch downtime type", error: error.message });
  }
};

// UPDATE
export const updateDowntimeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const updated = await DowntimeTypes.findByIdAndUpdate(
      id,
      {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Downtime type not found" });
    }

    return res.status(200).json({ message: "Downtime type updated", data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update downtime type", error: error.message });
  }
};

// DELETE
export const deleteDowntimeType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DowntimeTypes.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Downtime type not found" });
    }

    return res.status(200).json({ message: "Downtime type deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete downtime type", error: error.message });
  }
};