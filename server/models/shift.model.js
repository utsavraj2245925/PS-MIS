import mongoose from "mongoose";

/* ========================= BREAK ROW ========================= */
/* Times stored as "HH:mm" strings — these are daily recurring templates,
   not fixed calendar dates, so a bare time-of-day is the right shape
   (also matches how ManageShiftPage's TimePicker.format("HH:mm") sends it). */

const breakSchema = new mongoose.Schema({
  breakName: { type: String, required: true, trim: true },       // e.g. "Lunch Break"
  startTime: { type: String, required: true },                    // "12:30"
  endTime: { type: String, required: true },                      // "13:30"
  durationMinutes: { type: Number, default: 0 },                  // auto-calculated
}, { _id: false });

/* ========================= SHIFT ========================= */

const shiftSchema = new mongoose.Schema({
  // plant snapshot (source of truth is Plant collection; we snapshot name/location
  // the same way productionEntrySchema snapshots employee/plant info)
    plantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plant",
        required: true,
    },

    plantName: {
        type: String,
        required: true,
        trim: true,
    },

    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required: true,
    },

    locationName: {
        type: String,
        required: true,
        trim: true,
    },

  shiftName: { type: String, required: true, trim: true },        // "A Shift", "General Shift"
  shiftType: { type: String, enum: ["Morning", "Night","Afternoon"], required: true },

  shiftStartTime: { type: String, required: true },                // "07:30"
  shiftEndTime: { type: String, required: true },                  // "19:30"

  breaks: [breakSchema],

  // auto-calculated — never trust client-sent values, controller recomputes on every save
  totalShiftMinutes: { type: Number, default: 0 },
  totalBreakMinutes: { type: Number, default: 0 },
  actualWorkingMinutes: { type: Number, default: 0 },
  actualWorkingHours: { type: String, default: "" },               // display string e.g. "11h 0m"

  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// one shift name per plant (case handled in controller — Mongo collation
// isn't assumed here, so the controller does the case-insensitive check
// before insert; this index is the hard backstop)
shiftSchema.index({ plantId: 1, shiftName: 1 }, { unique: true });

export default mongoose.model("Shift", shiftSchema);