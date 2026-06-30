import mongoose from "mongoose";

const reworkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Rework = mongoose.model("Rework", reworkSchema);
export default Rework;