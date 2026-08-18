import Plant from "../../models/plants.model.js";
import User from "../../models/users.model.js";

/**
 * Builds Mongo query for ProductionEntry based on role + filters.
 * Returns { query, daysInRange, effectiveConveyorId }
 */
export const buildEntryQuery = async (user, filters = {}) => {
  const { fromDate, toDate, plantId, locationId, shiftId, conveyorId } = filters;

  const userLocationId = user.locationId?._id || user.locationId || null;
  const userPlantId    = user.plantId?._id || user.plantId || null;
  const userShiftId    = user.shiftId?._id || user.shiftId || null;
  const userConveyorId = user.conveyorId?._id || user.conveyorId || null;

  const query = {};
  if (fromDate || toDate) {
    query.entryDate = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      query.entryDate.$gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.entryDate.$lte = end;
    }
  }

  let daysInRange = 1;
  if (fromDate && toDate) {
    const startDateOnly = new Date(fromDate); startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(toDate); endDateOnly.setHours(0, 0, 0, 0);
    const diffDays = Math.round((endDateOnly - startDateOnly) / 86400000) + 1;
    daysInRange = Math.max(diffDays, 1);
  }

  if (user.role === "user") {
    if (userPlantId) query.plantId = userPlantId;
    if (userShiftId) query.shiftId = userShiftId;
  } else if (user.role === "manager") {
    if (userPlantId) query.plantId = userPlantId;
    if (shiftId) query.shiftId = shiftId;
  } else if (user.role === "plantAdmin") {
  if (plantId) {
    const permittedPlant = await Plant.findOne({
      _id: plantId,
      locationId: userLocationId,
      status: "Active",
    }).select("_id").lean();

    query.plantId = permittedPlant
      ? permittedPlant._id
      : { $in: [] };
  } else if (userLocationId) {
    const plants = await Plant.find({
      locationId: userLocationId,
      status: "Active",
    }).select("_id").lean();

    query.plantId = { $in: plants.map((p) => p._id) };
  }
    if (shiftId) query.shiftId = shiftId;
  } else if (user.role === "superAdmin") {
    if (plantId) {
      query.plantId = plantId;
    } else if (locationId) {
      const plants = await Plant.find({ locationId }).select("_id").lean();
      query.plantId = { $in: plants.map((p) => p._id) };
    }
    if (shiftId) query.shiftId = shiftId;
  }

  const effectiveConveyorId = user.role === "user" ? userConveyorId : (conveyorId || null);
  if (effectiveConveyorId) {
    const userFilter = { conveyorId: effectiveConveyorId, status: "Active", role: "user" };
    if (query.plantId) userFilter.plantId = query.plantId;
    const conveyorUsers = await User.find(userFilter).select("_id").lean();
    query.reportedBy = { $in: conveyorUsers.map((u) => u._id) };
  }

  return { query, daysInRange, effectiveConveyorId };
};

/**
 * Builds Mongo filter for ConveyorStrength — stores real
 * locationId/plantId/shiftId/conveyorId, so filtered directly.
 */
export const buildStrengthFilter = (user, filters = {}, effectiveConveyorId = null) => {
  const { plantId, locationId, shiftId } = filters;

  const userLocationId = user.locationId?._id || user.locationId || null;
  const userPlantId    = user.plantId?._id || user.plantId || null;
  const userShiftId    = user.shiftId?._id || user.shiftId || null;
  const userConveyorId = user.conveyorId?._id || user.conveyorId || null;

  const strengthFilter = { status: "Active" };

  if (user.role === "manager") {
    if (userPlantId) strengthFilter.plantId = userPlantId;
    if (shiftId) strengthFilter.shiftId = shiftId;
  } else if (user.role === "plantAdmin") {
    if (plantId) strengthFilter.plantId = plantId;
    else if (userLocationId) strengthFilter.locationId = userLocationId;
    if (shiftId) strengthFilter.shiftId = shiftId;
  } else if (user.role === "superAdmin") {
    if (plantId) strengthFilter.plantId = plantId;
    else if (locationId) strengthFilter.locationId = locationId;
    if (shiftId) strengthFilter.shiftId = shiftId;
  } else if (user.role === "user") {
    if (userPlantId) strengthFilter.plantId = userPlantId;
    if (userShiftId) strengthFilter.shiftId = userShiftId;
    if (userConveyorId) strengthFilter.conveyorId = userConveyorId;
  }

  if (effectiveConveyorId && user.role !== "user") {
    strengthFilter.conveyorId = effectiveConveyorId;
  }

  return strengthFilter;
};