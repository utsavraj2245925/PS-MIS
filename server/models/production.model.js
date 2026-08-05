import mongoose from "mongoose";

/* ========================= PRODUCTION ROW ========================= */
/* one row per (model, part) added via "Add Model to List" / "Complete & Add to List" */

const productionItemSchema = new mongoose.Schema({
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true },
  partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  conveyorStrengthId: { type: mongoose.Schema.Types.ObjectId, ref: "ConveyorStrength" },// which physical line this row was produced on
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift"}, 
  productionQty: { type: Number, default: 0 },
  demandPerShift:     { type: Number, default: 0 },
  achievementPercent: { type: Number, default: 0, min: 0, max: 100 }, // (productionQty / demandPerShift) *100
  locationId:{ type:mongoose.Schema.Types.ObjectId, ref:"Location"},
  locationName:{ type:String},
  effectiveHangerPerShift: {type: Number, default: 0},
  

  // NEW — per-model job timing (operator Start/Complete on the entry form)
  startTime: { type: Date },        // when the operator started loading this model/line
  endTime: { type: Date },          // when this model/line job was completed & saved
  durationMinutes: { type: Number, default: 0 }, // auto-calculated = endTime - startTime

}, { _id: false });

/* ========================= REJECT ROW ========================= */

const rejectItemSchema = new mongoose.Schema({
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true },
  partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  rejectTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "Reject", required: true },
  quantity: { type: Number, default: 0 },
}, { _id: false });

/* ========================= REWORK ROW ========================= */

const reworkItemSchema = new mongoose.Schema({
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true },
  partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  reworkTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "Rework", required: true },
  quantity: { type: Number, default: 0 },
}, { _id: false });

/* ========================= DOWNTIME ROW ========================= */
/* unchanged — already supports the auto-captured Stop/Resume + lunch-lock
   entries the new UI generates (downtimeTypeId is optional, so the
   auto "Lunch Break" row with no matching master record still saves fine) */

const downtimeSchema = new mongoose.Schema({
  downtimeTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "downtimeTypes" },
  type: { type: String, enum: ["Planned", "Unplanned"], required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  remark: { type: String, trim: true, maxlength: 120, default: "" },
}, { _id: false });

/* ========================= CONSUMABLE ROW ========================= */

const consumableSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
  quantity: { type: Number, default: 0 },
  measurementType: { type: String, enum: ["kg", "ltr", "pcs"], default: "kg" },
}, { _id: false });

/* ========================= MAIN ENTRY ========================= */

const productionEntrySchema = new mongoose.Schema({
  // user info (snapshot at time of entry)
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeName: { type: String, trim: true },
  employeeEmail: { type: String, trim: true },
  role: { type: String, trim: true },

  // plant info (snapshot at time of entry)
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: "Plant", required: true },
  plantName: { type: String, trim: true },

  // location info (snapshot at time of entry) — needed for location-wise
  // dashboard filtering; without these declared, the controller's
  // locationId/locationName were being silently stripped on save.
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  locationName: { type: String, trim: true },

  // shift
  shiftId:{
   type:mongoose.Schema.Types.ObjectId,
   ref:"Shift",
   required:true,
},

  shiftName:{
    type:String,
  },

  reportTime: {
    type: Date,
    default: Date.now
  },
  entryDate: {
    type: Date,
    default: Date.now,
    required: true,
  },

  // manpower
  requiredManpower: { type: Number, default: 0 },
  availableManpower: { type: Number, default: 0 },
  shortageManpower: { type: Number, default: 0 },

  // line items — production, rejects and reworks are independent lists now
  productions: [productionItemSchema],
  rejects: [rejectItemSchema],
  reworks: [reworkItemSchema],
  downtimes: [downtimeSchema],
  consumables: [consumableSchema],

  // downtime rollups
  totalPlannedDowntime: { type: Number, default: 0 },
  totalUnplannedDowntime: { type: Number, default: 0 },
  totalDowntime: { type: Number, default: 0 },

  // final summary
  totalProductionQty: { type: Number, default: 0 }, // = sum(productions) + sum(reworks)
  totalRejectQty: { type: Number, default: 0 },
  totalReworkQty: { type: Number, default: 0 },
  totalDefectQty: { type: Number, default: 0 }, // = totalRejectQty + totalReworkQty
  finalRemark: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["Draft", "Submitted", "Rejected"], default: "Submitted" },
  shiftSummary: {
    target: { type: Number, default: 0 },
    achieved: { type: Number, default: 0 },
    achievement: { type: Number, default: 0, min: 0 },
  }
}, { timestamps: true });

productionEntrySchema.index(
  {
    plantId: 1,
    shiftId: 1,
    entryDate: 1,
    reportedBy:1,
  },
  
);

export default mongoose.model("ProductionEntry", productionEntrySchema);