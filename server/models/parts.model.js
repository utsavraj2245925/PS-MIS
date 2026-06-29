import mongoose from "mongoose";

const partSchema = new mongoose.Schema(
  {
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
    },
    partName: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: Number,
    },
    partsPerHanger: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Part", partSchema);