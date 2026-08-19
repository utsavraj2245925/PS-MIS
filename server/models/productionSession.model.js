import mongoose from "mongoose";

/* ============================================================
   PART PRODUCTION

   Multiple parts can be produced during ONE model session.
============================================================ */

const partProductionSchema = new mongoose.Schema(
  {
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },

    partName: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);


/* ============================================================
   DYNAMIC TIME BLOCK SNAPSHOT

   These blocks are generated dynamically from:

   Shift Master
        ↓
   liveBlock.utils.js
        ↓
   Production Session

   There is NO TimeBlockConfiguration dependency here.
============================================================ */

const timeBlockOverlapSchema = new mongoose.Schema(
  {
    blockNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    blockLabel: {
      type: String,
      trim: true,
      required: true,
    },

    blockType: {
      type: String,
      enum: ["Production", "Break"],
      required: true,
    },

    blockStartTime: {
      type: Date,
      required: true,
    },

    blockEndTime: {
      type: Date,
      required: true,
    },

    overlapStartTime: {
      type: Date,
    },

    overlapEndTime: {
      type: Date,
    },

    overlapMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    productionQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    productionRatePerHour: {
      type: Number,
      default: 0,
      min: 0,
    },

    downtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    runningMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);


/* ============================================================
   MAIN PRODUCTION SESSION
============================================================ */

const productionSessionSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------
       SESSION IDENTIFICATION
    --------------------------------------------------------- */

    sessionNumber: {
      type: String,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Running", "Completed", "Cancelled"],
      default: "Running",
      index: true,
    },


    /* ---------------------------------------------------------
       USER SNAPSHOT
    --------------------------------------------------------- */

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    employeeName: {
      type: String,
      trim: true,
    },

    employeeEmail: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      trim: true,
    },


    /* ---------------------------------------------------------
       ORGANIZATION
    --------------------------------------------------------- */

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
      index: true,
    },

    locationName: {
      type: String,
      trim: true,
    },

    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: true,
      index: true,
    },

    plantName: {
      type: String,
      trim: true,
    },

    conveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conveyor",
      index: true,
    },

    conveyorName: {
      type: String,
      trim: true,
    },


    /* ---------------------------------------------------------
       SHIFT SNAPSHOT

       Original Shift Master remains the source of truth.

       These fields preserve the shift information that was
       used when this production session started.
    --------------------------------------------------------- */

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },

    shiftName: {
      type: String,
      trim: true,
    },

    shiftType: {
      type: String,
      trim: true,
    },

    shiftStartTime: {
      type: String,
      trim: true,
    },

    shiftEndTime: {
      type: String,
      trim: true,
    },


    /* ---------------------------------------------------------
       MODEL
    --------------------------------------------------------- */

    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
      index: true,
    },

    modelName: {
      type: String,
      trim: true,
    },


    /* ---------------------------------------------------------
       MODEL TIMELINE
    --------------------------------------------------------- */

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
    },

    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       PRODUCTION PARTS
    --------------------------------------------------------- */

    parts: {
      type: [partProductionSchema],
      default: [],
    },


    /* ---------------------------------------------------------
       TOTAL PRODUCTION
    --------------------------------------------------------- */

    totalProductionQty: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       TARGET
    --------------------------------------------------------- */

    demandPerShift: {
      type: Number,
      default: 0,
      min: 0,
    },

    targetPerSession: {
      type: Number,
      default: 0,
      min: 0,
    },

    targetPerHour: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       PRODUCTION RATE
    --------------------------------------------------------- */

    averageProductionRatePerHour: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       DOWNTIME
    --------------------------------------------------------- */

    grossDurationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    downtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    runningMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       PERFORMANCE
    --------------------------------------------------------- */

    achievementPercent: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       DYNAMIC TIME BLOCK SNAPSHOTS

       These are generated from Shift Master dynamically.
    --------------------------------------------------------- */

    timeBlocks: {
      type: [timeBlockOverlapSchema],
      default: [],
    },


    /* ---------------------------------------------------------
       PAINT SHOP METRICS
    --------------------------------------------------------- */

    paintedAreaM2: {
      type: Number,
      default: 0,
      min: 0,
    },

    hangersUsed: {
      type: Number,
      default: 0,
      min: 0,
    },


    /* ---------------------------------------------------------
       REMARK
    --------------------------------------------------------- */

    remark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


/* ============================================================
   INDEXES
============================================================ */

productionSessionSchema.index({
  plantId: 1,
  shiftId: 1,
  startTime: 1,
});

productionSessionSchema.index({
  locationId: 1,
  plantId: 1,
  shiftId: 1,
  conveyorId: 1,
});

productionSessionSchema.index({
  modelId: 1,
  startTime: 1,
});

productionSessionSchema.index({
  status: 1,
  plantId: 1,
  shiftId: 1,
  conveyorId: 1,
});


/* ============================================================
   MODEL EXPORT
============================================================ */

export default mongoose.model(
  "ProductionSession",
  productionSessionSchema
);