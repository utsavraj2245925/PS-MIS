import mongoose from "mongoose";

const partSchema = new mongoose.Schema(
  {
    model: {
      type: String,
      required: true,
    },

    partName: {
      type: String,
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },

    partsPerHanger: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Part = mongoose.model("Part", partSchema);

export default Part;