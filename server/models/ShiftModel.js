import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    productionEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionEntry",
    },

    shiftSchedule: {
      type: String,
      enum: ["Day", "Night"],
      required: true,
    },

    shiftStartTime: Date,

    shiftEndTime: Date,

    shiftDuration: Number,

    location: String,

    plant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "Shift",
  shiftSchema
);