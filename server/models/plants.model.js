import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    plantName: { type: String, required: true, trim: true, unique: true },
    plantCode: { type: String, required: true, unique: true, trim: true },
    location:  { type: String, required: true, trim: true },
    plantAdmin: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    isActive: { type: Boolean, default: true }, // kept for backward compat
  },
  { timestamps: true }
);

const plantModel = mongoose.model("Plant", plantSchema);
export default plantModel;  