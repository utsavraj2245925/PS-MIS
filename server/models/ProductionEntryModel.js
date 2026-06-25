import mongoose from "mongoose";

const productionEntrySchema =
  new mongoose.Schema(
    {
      // SHIFT INFO

      date: {
        type: String,
      },

      shift: {
        type: String,
      },

      location: {
        type: String,
      },

      plant: {
        type: String,
      },

      reportedBy: {
        type: String,
      },

      email: {
        type: String,
      },

      reportTime: {
        type: Date,
        default: Date.now,
      },

      // MANPOWER

      requiredManpower: {
        type: Number,
      },

      availableManpower: {
        type: Number,
      },

      shortManpower: {
        type: Number,
      },

      // PRODUCTION ENTRY

      productionEntries: [
        {
          modelName: {
            type: String,
          },

          parts: [
            {
              partName: {
                type: String,
              },

              quantity: {
                type: Number,
              },
            },
          ],
        },
      ],

      // PLANNED DOWNTIME

      plannedDowntime: [
        {
          startTime: String,

          endTime: String,

          duration: Number,

          reason: String,
        },
      ],

      // UNPLANNED DOWNTIME

      unplannedDowntime: [
        {
          startTime: String,

          endTime: String,

          duration: Number,

          reason: String,

          description: String,
        },
      ],

      // CONSUMABLES

      consumables: [
        {
          itemDescription: String,

          quantityConsumed: Number,
        },
      ],

      // POWDER

      powderConsumption: [
        {
          powderType: String,

          quantityConsumed: Number,
        },
      ],

      // QUALITY DEFECTS

      qualityDefects: [
        {
          modelName: String,

          partName: String,

          defectType: String,

          defectQuantity: Number,
        },
      ],

      // REWORK

      reworks: [
        {
          modelName: String,

          partName: String,

          reworkReason: String,

          reworkedQuantity: Number,
        },
      ],
    },

    {
      timestamps: true,
    }
  );

const ProductionEntry =
  mongoose.model(
    "ProductionEntry",
    productionEntrySchema
  );

export default ProductionEntry;