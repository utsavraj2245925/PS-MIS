import ProductionEntry from "../models/ProductionEntryModel.js";

// CREATE ENTRY

export const createProductionEntry =
  async (req, res) => {

    try {

      const entry =
        await ProductionEntry.create(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Production Entry Saved",
        data: entry,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

// GET ALL ENTRIES

export const getProductionEntries =
  async (req, res) => {

    try {

      const entries =
        await ProductionEntry.find()
          .sort({ createdAt: -1 });

      return res.status(200).json(
        entries
      );

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };