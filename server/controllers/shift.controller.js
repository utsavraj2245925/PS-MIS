import Shift from "../models/shift.model.js";
import Plant from "../models/plants.model.js";

/* ========================= TIME HELPERS ========================= */
/* All shift/break times are "HH:mm" strings. Night shifts commonly cross
   midnight (e.g. 19:30 -> 07:30), so every comparison below normalizes
   times relative to the shift's own start time. */

const timeToMinutes = (t) => {
  if (!t || typeof t !== "string" || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const normalizeToShift = (shiftStartMin, t) => {
  const v = timeToMinutes(t);
  if (v === null) return null;
  return v < shiftStartMin ? v + 1440 : v;
};

const minutesToHM = (mins) => {
  const m = Math.max(Math.round(mins || 0), 0);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const computeShiftBreakdown = ({ shiftStartTime, shiftEndTime, breaks = [] }) => {
  const shiftStartMin = timeToMinutes(shiftStartTime);
  const shiftEndMin = normalizeToShift(shiftStartMin, shiftEndTime);
  if (shiftStartMin === null || shiftEndMin === null) {
    throw new Error("Shift start and end time must be valid HH:mm values");
  }
  if (shiftEndMin <= shiftStartMin) {
    throw new Error("Shift end time must be after start time");
  }
  const totalShiftMinutes = shiftEndMin - shiftStartMin;

  const normalized = breaks.map((b) => {
    if (!b.breakName?.trim()) throw new Error("Every break must have a name");
    const bStart = normalizeToShift(shiftStartMin, b.startTime);
    const bEnd = normalizeToShift(shiftStartMin, b.endTime);
    if (bStart === null || bEnd === null) throw new Error(`Break "${b.breakName}" has an invalid time`);
    if (bEnd <= bStart) throw new Error(`Break "${b.breakName}" end time must be after its start time`);
    if (bStart < shiftStartMin || bEnd > shiftEndMin) throw new Error(`Break "${b.breakName}" must lie within shift hours`);
    return {
      breakName: b.breakName.trim(), startTime: b.startTime, endTime: b.endTime,
      durationMinutes: bEnd - bStart, _start: bStart, _end: bEnd,
    };
  });

  normalized.sort((a, b) => a._start - b._start);
  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i]._start < normalized[i - 1]._end) {
      throw new Error(`Break "${normalized[i].breakName}" overlaps with "${normalized[i - 1].breakName}"`);
    }
  }

  const totalBreakMinutes = normalized.reduce((s, b) => s + b.durationMinutes, 0);
  const actualWorkingMinutes = Math.max(totalShiftMinutes - totalBreakMinutes, 0);

  return {
    totalShiftMinutes, totalBreakMinutes, actualWorkingMinutes,
    breaks: normalized.map(({ breakName, startTime, endTime, durationMinutes }) => ({ breakName, startTime, endTime, durationMinutes })),
  };
};

/* ========================= CREATE ========================= */

export const createShift = async (req, res) => {
  try {
    const {
      plantId, locationId, shiftName, shiftType,
      shiftStartTime, shiftEndTime, breaks = [],
      status = "Active", createdBy,
    } = req.body;

    if (!plantId) return res.status(400).json({ success: false, message: "Plant is required" });
    if (!shiftName?.trim()) return res.status(400).json({ success: false, message: "Shift name is required" });
    if (!shiftType) return res.status(400).json({ success: false, message: "Shift type is required" });
    if (!shiftStartTime || !shiftEndTime) return res.status(400).json({ success: false, message: "Shift start and end time are required" });

    // Fetch and check the plant EXISTS before touching any of its fields —
    // the previous version dereferenced plant.locationId before this check,
    // which crashed with a 500 whenever plantId didn't match a real plant.
    const plant = await Plant.findById(plantId);
    if (!plant) return res.status(404).json({ success: false, message: "Plant not found" });

    // Defense-in-depth: the frontend's cascading Location -> Plant dropdown
    // sends locationId too; cross-check it matches the plant's real location
    // (guards against stale dropdown state). Skipped if not sent.
    if (locationId && String(plant.locationId) !== String(locationId)) {
      return res.status(400).json({
        success: false,
        message: "Selected plant does not belong to the selected location.",
      });
    }

    const duplicate = await Shift.findOne({
      plantId,
      shiftName: { $regex: `^${shiftName.trim()}$`, $options: "i" },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `"${shiftName}" already exists for ${plant.plantName}` });
    }

    const calc = computeShiftBreakdown({ shiftStartTime, shiftEndTime, breaks });

    const shift = await Shift.create({
      plantId,
      plantName: plant.plantName,
      locationId: plant.locationId,
      locationName: plant.locationName,
      shiftName: shiftName.trim(),
      shiftType,
      shiftStartTime,
      shiftEndTime,
      breaks: calc.breaks,
      totalShiftMinutes: calc.totalShiftMinutes,
      totalBreakMinutes: calc.totalBreakMinutes,
      actualWorkingMinutes: calc.actualWorkingMinutes,
      actualWorkingHours: minutesToHM(calc.actualWorkingMinutes),
      status,
      createdBy: createdBy || undefined,
    });

    return res.status(201).json({ success: true, message: "Shift created successfully", data: shift });
  } catch (error) {
    console.error("CREATE SHIFT ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to create shift" });
  }
};

/* ========================= UPDATE ========================= */

export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plantId, locationId, shiftName, shiftType,
      shiftStartTime, shiftEndTime, breaks, status, updatedBy,
    } = req.body;

    const existing = await Shift.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Shift not found" });

    let targetPlantId = existing.plantId;
    let plantName = existing.plantName;
    let targetLocationId = existing.locationId;
    let locationName = existing.locationName;

    // Only re-resolve plant/location if the plant is actually changing —
    // this also lets Activate/Deactivate send just { status } with no
    // risk of accidentally touching plant/location.
    if (plantId && String(plantId) !== String(existing.plantId)) {
      const plant = await Plant.findById(plantId);
      if (!plant) return res.status(404).json({ success: false, message: "Plant not found" });

      if (locationId && String(plant.locationId) !== String(locationId)) {
        return res.status(400).json({
          success: false,
          message: "Selected plant does not belong to the selected location.",
        });
      }

      targetPlantId = plant._id;
      plantName = plant.plantName;
      targetLocationId = plant.locationId;
      locationName = plant.locationName;
    }

    const finalShiftName = (shiftName ?? existing.shiftName).trim();
    if (!finalShiftName) return res.status(400).json({ success: false, message: "Shift name is required" });

    const duplicate = await Shift.findOne({
      plantId: targetPlantId,
      shiftName: { $regex: `^${finalShiftName}$`, $options: "i" },
      _id: { $ne: id },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `"${finalShiftName}" already exists for this plant` });
    }

    const calc = computeShiftBreakdown({
      shiftStartTime: shiftStartTime || existing.shiftStartTime,
      shiftEndTime: shiftEndTime || existing.shiftEndTime,
      breaks: breaks !== undefined ? breaks : existing.breaks,
    });

    existing.plantId = targetPlantId;
    existing.plantName = plantName;
    existing.locationId = targetLocationId;
    existing.locationName = locationName;
    existing.shiftName = finalShiftName;
    existing.shiftType = shiftType || existing.shiftType;
    existing.shiftStartTime = shiftStartTime || existing.shiftStartTime;
    existing.shiftEndTime = shiftEndTime || existing.shiftEndTime;
    existing.breaks = calc.breaks;
    existing.totalShiftMinutes = calc.totalShiftMinutes;
    existing.totalBreakMinutes = calc.totalBreakMinutes;
    existing.actualWorkingMinutes = calc.actualWorkingMinutes;
    existing.actualWorkingHours = minutesToHM(calc.actualWorkingMinutes);
    if (status) existing.status = status;
    if (updatedBy) existing.updatedBy = updatedBy;

    await existing.save();
    return res.status(200).json({ success: true, message: "Shift updated successfully", data: existing });
  } catch (error) {
    console.error("UPDATE SHIFT ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to update shift" });
  }
};

/* ========================= DELETE (permanent) ========================= */

export const deleteShift = async (req, res) => {
  try {
    const deleted = await Shift.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Shift not found" });
    return res.status(200).json({ success: true, message: "Shift deleted successfully" });
  } catch (error) {
    console.error("DELETE SHIFT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete shift" });
  }
};

/* ========================= GET ALL (with filters) ========================= */

export const getAllShifts = async (req, res) => {
  try {
    const { plantId, locationId, shiftType, status, search } = req.query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (plantId) filter.plantId = plantId;
    if (shiftType) filter.shiftType = shiftType;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { shiftName: { $regex: search, $options: "i" } },
        { plantName: { $regex: search, $options: "i" } },
        { locationName: { $regex: search, $options: "i" } },
      ];
    }

    const shifts = await Shift.find(filter).sort({ locationName: 1, plantName: 1, shiftType: 1 });
    return res.status(200).json({
      success: true,
      message: "Shifts fetched successfully",
      count: shifts.length,
      data: shifts,
    });
  } catch (error) {
    console.error("GET SHIFTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch shifts" });
  }
};

/* ========================= GET SHIFTS BY LOCATION ========================= */

export const getShiftsByLocation = async (req, res) => {
  try {
    const shifts = await Shift.find({
      locationId: req.params.locationId,
      status: "Active",
    }).sort({ shiftName: 1 });

    return res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ========================= GET SHIFTS BY PLANT ========================= */

export const getShiftsByPlant = async (req, res) => {
  try {
    const { plantId } = req.params;
    const shifts = await Shift.find({ plantId, status: "Active" }).sort({ shiftType: 1 });
    return res.status(200).json({ success: true, message: "Shifts fetched successfully", data: shifts });
  } catch (error) {
    console.error("GET SHIFTS BY PLANT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch shifts for plant" });
  }
};

/* ========================= GET ACTIVE SHIFT (right now, for this plant) ========================= */

export const getActiveShift = async (req, res) => {
  try {
    const { plantId } = req.params;
    const shifts = await Shift.find({ plantId, status: "Active" });
    if (!shifts.length) {
      return res.status(404).json({ success: false, message: "No active shift configured for this plant" });
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const match = shifts.find((s) => {
      const startMin = timeToMinutes(s.shiftStartTime);
      let endMin = timeToMinutes(s.shiftEndTime);
      if (endMin <= startMin) endMin += 1440; // overnight
      const nm = nowMinutes < startMin ? nowMinutes + 1440 : nowMinutes;
      return nm >= startMin && nm < endMin;
    });

    if (!match) {
      return res.status(404).json({ success: false, message: "No shift is currently active for this plant", data: shifts });
    }

    return res.status(200).json({ success: true, message: "Active shift fetched successfully", data: match });
  } catch (error) {
    console.error("GET ACTIVE SHIFT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch active shift" });
  }
};