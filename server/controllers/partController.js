import Part from "../models/PartModel.js";

export const createPart = async (req, res) => {
  try {
    const part = await Part.create(req.body);

    return res.status(201).json(part);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getParts = async (req, res) => {
  try {
    const parts = await Part.find().lean();

  return  res.json(parts);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deletePart = async (req, res) => {
  try {
    const part = await Part.findByIdAndDelete(req.params.id);
    if (!part) {
      return res.status(404).json({
        message: "Part not found",
      });
    }
    return res.json({
      message: "Part deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updatePart = async (req, res) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!part) {
      return res.status(404).json({
        message: "Part not found",
      });
    }

   return res.json(part);
  } catch (error) {
  return  res.status(500).json({
      message: error.message,
    });
  }
};

export const getFilterParts = async (req, res) => {
    try {
        console.log("Filter function is running...");
        const { model, partName, status } = req.query;
        console.log("Received filter params:", { model, partName, status });

        const searchRegex = partName ? new RegExp(partName, "i") : null;

        const filter = {};
        if (model) filter.model = model;
        if (partName) filter.partName = searchRegex;
        if (status) filter.status = status;

        const parts = await Part.find(filter).lean();
        return res.json(parts);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
