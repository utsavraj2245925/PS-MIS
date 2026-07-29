import mongoose from "mongoose";

/* ==========================================
   CONVEYOR SCHEMA
========================================== */

const conveyorSchema = new mongoose.Schema(
  {
    conveyorName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    _id: true,
  }
);

/* ==========================================
   PLANT SCHEMA
========================================== */

const plantSchema = new mongoose.Schema(
  {
    plantName: {
      type: String,
      required: true,
      trim: true,
    },

    plantCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },

    locationId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Location",
      required:true,
    },
    locationName:{
      type:String,
      required:true,
      trim:true,
    },


    /* ==========================================
       CONVEYORS
    ========================================== */

    conveyors: {
      type: [conveyorSchema],
      default: [],
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

/* ==========================================
   INDEXES
========================================== */

plantSchema.index({
    locationId: 1,
    plantName: 1,
}, {
    unique: true,
});

plantSchema.index({
    "conveyors.conveyorName":1,
});

export default mongoose.model("Plant", plantSchema);