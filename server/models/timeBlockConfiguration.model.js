import mongoose from "mongoose";

const timeBlockSchema = new mongoose.Schema(
  {
    blockNumber: {
      type: Number,
      required: true,
    },

    blockName: {
      type: String,
      required: true,
      trim: true,
    },

    startOffsetMinutes: {
      type: Number,
      required: true,
      min: 0,
    },

    endOffsetMinutes: {
      type: Number,
      required: true,
      min: 0,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);


const timeBlockConfigurationSchema = new mongoose.Schema(
  {
    /* ========================================================
       ORGANIZATION
    ======================================================== */

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
      index: true,
    },

    locationName: {
      type: String,
      trim: true,
    },

    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: true,
      index: true,
    },

    plantName: {
      type: String,
      trim: true,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },

    shiftName: {
      type: String,
      trim: true,
    },

    conveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conveyor",
    },

    conveyorName: {
      type: String,
      trim: true,
    },


    /* ========================================================
       CONFIGURATION
    ======================================================== */

    blockType: {
      type: String,
      enum: [
        "Hourly",
        "Custom",
      ],
      default: "Hourly",
    },

    blocks: {
      type: [timeBlockSchema],
      default: [],
    },


    /* ========================================================
       STATUS
    ======================================================== */

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
      ],
      default: "Active",
    },


    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);


timeBlockConfigurationSchema.index({
  locationId: 1,
  plantId: 1,
  shiftId: 1,
  conveyorId: 1,
  status: 1,
});


export default mongoose.model(
  "TimeBlockConfiguration",
  timeBlockConfigurationSchema
);