import Material from "../models/material.model.js";

const VALID_TYPES = ["powderItems", "chemicalItems", "usefulItems"];

// CREATE
export const createMaterial = async (req, res) => {
  try {
    const { name, type, mesurmentType } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "name and type are required" });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const exists = await Material.findOne({ name: name.trim(), type });
    if (exists) {
      return res.status(409).json({ message: "This material already exists for this category" });
    }

    const material = await Material.create({
      name: name.trim(),
      type,
      mesurmentType,
    });

    return res.status(201).json({ message: "Material created", data: material });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create material", error: error.message });
  }
};

// READ ALL — query: ?type=powderItems|chemicalItems|usefulItems
export const getAllMaterials = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const materials = await Material.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ data: materials });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch materials", error: error.message });
  }
};

// READ ONE
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    return res.status(200).json({ data: material });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch material", error: error.message });
  }
};

// UPDATE
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, mesurmentType } = req.body;

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const updated = await Material.findByIdAndUpdate(
      id,
      {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(mesurmentType ? { mesurmentType } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Material not found" });
    }

    return res.status(200).json({ message: "Material updated", data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update material", error: error.message });
  }
};

// DELETE
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Material.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Material not found" });
    }

    return res.status(200).json({ message: "Material deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete material", error: error.message });
  }
};