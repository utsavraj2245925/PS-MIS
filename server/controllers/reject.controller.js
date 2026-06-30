import Reject from "../models/reject.model.js";

// CREATE
export const createReject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const exists = await Reject.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ message: "This reject type already exists" });
    }

    const reject = await Reject.create({ name: name.trim() });
    return res.status(201).json({ message: "Reject type created", data: reject });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create reject type", error: error.message });
  }
};

// READ ALL
export const getAllRejects = async (req, res) => {
  try {
    const rejects = await Reject.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: rejects });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reject types", error: error.message });
  }
};

// READ ONE
export const getRejectById = async (req, res) => {
  try {
    const { id } = req.params;
    const reject = await Reject.findById(id);

    if (!reject) {
      return res.status(404).json({ message: "Reject type not found" });
    }

    return res.status(200).json({ data: reject });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reject type", error: error.message });
  }
};

// UPDATE
export const updateReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await Reject.findByIdAndUpdate(
      id,
      { name: name?.trim() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Reject type not found" });
    }

    return res.status(200).json({ message: "Reject type updated", data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This reject type already exists" });
    }
    return res.status(500).json({ message: "Failed to update reject type", error: error.message });
  }
};

// DELETE
export const deleteReject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Reject.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Reject type not found" });
    }

    return res.status(200).json({ message: "Reject type deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete reject type", error: error.message });
  }
};