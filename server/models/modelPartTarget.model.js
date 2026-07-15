import mongoose from "mongoose";

const modelPartTargetSchema = new mongoose.Schema({
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: "Plant", required: true },
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true },
  partId:  { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  demandPerShift: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

// one target per Plant + Model + Part combo
modelPartTargetSchema.index({ plantId: 1, modelId: 1, partId: 1 }, { unique: true });

export default mongoose.model("ModelPartTarget", modelPartTargetSchema);