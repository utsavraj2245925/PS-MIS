import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    plantName: {
      type: String,
      required: true,
    },

    plantCode: {
    type: String,
    required: true,
    unique: true,
    },

    location: {
      type: String,
      required: true,
    },

    plantAdmin: {
      type: String,
      required: true,
    },

    conveyorLength: Number,

    conveyorSpeed: Number,

    pitchDistance: Number,

    setPerRound: Number,

    availableTime: Number,

    efficiency: Number,

    hangers: Number,

    processTime: Number,

    totalRoundsShift: Number,

    productionPerShift: Number,

    totalTargetPerDay: Number,

    status: {
      type: String,
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