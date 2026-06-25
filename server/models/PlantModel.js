import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    plantName: {
      type: String,
      required: true,
      trim: true,
    },

    plantCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    plantAdmin: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================
    // MANUAL INPUT FIELDS
    // ==========================

    conveyorLength: {
      type: Number,
      default: 0,
    },

    conveyorSpeed: {
      type: Number,
      default: 0,
    },

    pitchDistance: {
      type: Number,
      default: 0,
    },

    availableTime: {
      type: Number,
      default: 630,
    },

    demandPerShift: {
      type: Number,
      default: 0,
    },

    hangerEfficiency: {
      type: Number,
      enum: [100, 95, 85, 75],
      default: 100,
    },

    // ==========================
    // AUTO CALCULATED FIELDS
    // ==========================

    totalHangers: {
      type: Number,
      default: 0,
    },

    processTime: {
      type: Number,
      default: 0,
    },

    totalRoundsShift: {
      type: Number,
      default: 0,
    },

    hangerPerMinute: {
      type: Number,
      default: 0,
    },

    availableHangerPerShift: {
      type: Number,
      default: 0,
    },

    effectiveHangerPerShift: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Plant",
  plantSchema
);