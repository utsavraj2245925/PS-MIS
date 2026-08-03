import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    locationName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    locationCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =======================
   INDEXES
========================== */

// locationSchema.index({
//   locationCode: 1,
// });

// locationSchema.index({
//   locationName: 1,
// });

export default mongoose.model("Location", locationSchema);