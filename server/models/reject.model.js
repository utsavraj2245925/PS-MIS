import mongoose from "mongoose";

const rejectSchema = new mongoose.Schema(
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

const Reject = mongoose.model("Reject", rejectSchema);
export default Reject;