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
      unique: true,
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
    area: { type: Number, default: 0 },
    partsPerHanger: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("Part", partSchema);