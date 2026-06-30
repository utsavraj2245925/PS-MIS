import mongoose from "mongoose";

const defectSchema = new mongoose.Schema(
  {
    defectedModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
    },
    defectedPart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
    },
    defectedQnt: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["reject", "rework"],
      required: true,
    },
    // dynamic ref: points to "Reject" docs when type === "reject",
    // and to "Rework" docs when type === "rework"
    defectType: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "defectTypeModel",
    },
    defectTypeModel: {
      type: String,
      required: true,
      enum: ["Reject", "Rework"],
    },
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
    },
  },
  { timestamps: true }
);

const Defect = mongoose.model("Defect", defectSchema);
export default Defect;