import mongoose from "mongoose";

const downtimeEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Planned", "Unplanned"],
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
    },

    durationMinutes: {
      type: Number,
      default: 0,
    },

    remark: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Running", "Completed"],
      default: "Running",
    },
  },
  { _id: true }
);


const shiftRuntimeSchema = new mongoose.Schema(
  {
    /* ========================================================
       ORGANIZATION
    ======================================================== */

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
      index: true,
    },

    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: true,
      index: true,
    },

    conveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conveyor",
      index: true,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },


    /* ========================================================
       SHIFT STATUS
    ======================================================== */

    status: {
      type: String,
      enum: [
        "NotStarted",
        "Running",
        "Completed",
      ],
      default: "NotStarted",
    },

    shiftStartTime: {
      type: Date,
    },

    shiftEndTime: {
      type: Date,
    },


    /* ========================================================
       CURRENT MODEL
    ======================================================== */

    currentModelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
    },

    currentModelName: {
      type: String,
      trim: true,
    },

    currentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionSession",
    },

    modelStartTime: {
      type: Date,
    },


    /* ========================================================
       LIVE DOWNTIME
    ======================================================== */

    currentDowntimeId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    downtimeEvents: {
      type: [downtimeEventSchema],
      default: [],
    },


    /* ========================================================
       LIVE METRICS
    ======================================================== */

    totalProductionQty: {
      type: Number,
      default: 0,
    },

    totalRejectQty: {
      type: Number,
      default: 0,
    },

    totalReworkQty: {
      type: Number,
      default: 0,
    },

    totalDowntimeMinutes: {
      type: Number,
      default: 0,
    },

    runningMinutes: {
      type: Number,
      default: 0,
    },

    averageProductionRatePerHour: {
      type: Number,
      default: 0,
    },


    /* ========================================================
       LAST UPDATE
    ======================================================== */

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


shiftRuntimeSchema.index({
  locationId: 1,
  plantId: 1,
  shiftId: 1,
  conveyorId: 1,
});


export default mongoose.model(
  "ShiftRuntime",
  shiftRuntimeSchema
);