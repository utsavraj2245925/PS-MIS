import Rework from "../models/rework.model.js";

// CREATE
export const createRework = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const exists = await Rework.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ message: "This rework type already exists" });
    }

    const rework = await Rework.create({ name: name.trim() });
    return res.status(201).json({ message: "Rework type created", data: rework });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create rework type", error: error.message });
  }
};

// READ ALL
export const getAllReworks = async (req, res) => {
  try {
    const reworks = await Rework.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: reworks });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch rework types", error: error.message });
  }
};

// READ ONE
export const getReworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const rework = await Rework.findById(id);

    if (!rework) {
      return res.status(404).json({ message: "Rework type not found" });
    }

    return res.status(200).json({ data: rework });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch rework type", error: error.message });
  }
};

// UPDATE
export const updateRework = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await Rework.findByIdAndUpdate(
      id,
      { name: name?.trim() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Rework type not found" });
    }

    return res.status(200).json({ message: "Rework type updated", data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This rework type already exists" });
    }
    return res.status(500).json({ message: "Failed to update rework type", error: error.message });
  }
};

// DELETE
export const deleteRework = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Rework.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Rework type not found" });
    }

    return res.status(200).json({ message: "Rework type deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete rework type", error: error.message });
  }
};