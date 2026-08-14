
import mongoose from "mongoose";
import TimeBlockConfiguration from "../models/timeBlockConfiguration.model.js";
import Location from "../models/location.model.js";
import Plant from "../models/plants.model.js";
import Shift from "../models/shift.model.js";
import ConveyorStrength from "../models/ConveyorStrength.model.js";

/* =========================================================
   HELPERS
========================================================= */

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);
const toNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const toDate = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; };

const sortBlocks = (blocks = []) => [...blocks].sort((a, b) => Number(a.blockNumber || 0) - Number(b.blockNumber || 0));

const validateBlock = (block, index) => {
  const start = toNumber(block.startOffsetMinutes);
  const end = toNumber(block.endOffsetMinutes);
  const duration = toNumber(block.durationMinutes);

  if (!block.blockName?.trim()) throw new Error(`Block ${index + 1}: block name is required`);
  if (start < 0) throw new Error(`Block ${index + 1}: start offset cannot be negative`);
  if (end <= start) throw new Error(`Block ${index + 1}: end offset must be greater than start offset`);
  if (duration <= 0) throw new Error(`Block ${index + 1}: duration must be greater than 0`);

  if (duration !== end - start) throw new Error(`Block ${index + 1}: duration must equal endOffsetMinutes - startOffsetMinutes`);

  return { ...block, blockName: block.blockName.trim(), startOffsetMinutes: start, endOffsetMinutes: end, durationMinutes: duration, active: block.active !== false };
};

const validateBlocks = (blocks = []) => {
  if (!Array.isArray(blocks)) throw new Error("Blocks must be an array");

  const normalized = sortBlocks(blocks).map(validateBlock);

  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i].startOffsetMinutes < normalized[i - 1].endOffsetMinutes) {
      throw new Error(`Block "${normalized[i].blockName}" overlaps with "${normalized[i - 1].blockName}"`);
    }
  }

  return normalized;
};

const validateOrganization = async ({ locationId, plantId, shiftId, conveyorId }) => {
  if (!isValidId(locationId)) throw new Error("Valid Location is required");
  if (!isValidId(plantId)) throw new Error("Valid Plant is required");
  if (!isValidId(shiftId)) throw new Error("Valid Shift is required");

  const [location, plant, shift] = await Promise.all([
    Location.findById(locationId).lean(),
    Plant.findById(plantId).lean(),
    Shift.findById(shiftId).lean(),
  ]);

  if (!location) throw new Error("Location not found");
  if (!plant) throw new Error("Plant not found");
  if (!shift) throw new Error("Shift not found");

  if (String(plant.locationId) !== String(location._id)) throw new Error("Selected plant does not belong to selected location");
  if (String(shift.plantId) !== String(plant._id)) throw new Error("Selected shift does not belong to selected plant");

  let conveyorName = "";

  if (conveyorId) {
    if (!isValidId(conveyorId)) throw new Error("Invalid Conveyor ID");

    const strength = await ConveyorStrength.findOne({ conveyorId, plantId: plant._id, shiftId: shift._id }).lean();
    if (strength?.conveyorName) conveyorName = strength.conveyorName;
  }

  return {
    location,
    plant,
    shift,
    conveyorName,
  };
};

/* =========================================================
   CREATE CONFIGURATION
========================================================= */

export const createTimeBlockConfiguration = async ({
  locationId,
  plantId,
  shiftId,
  conveyorId = null,
  blockType = "Hourly",
  blocks = [],
  status = "Active",
  createdBy = null,
}) => {
  const organization = await validateOrganization({ locationId, plantId, shiftId, conveyorId });

  const normalizedBlocks = validateBlocks(blocks);

  if (!normalizedBlocks.length) throw new Error("At least one time block is required");

  if (!["Hourly", "Custom"].includes(blockType)) throw new Error("Invalid block type");

  const duplicateQuery = {
    locationId,
    plantId,
    shiftId,
    status: "Active",
  };

  if (conveyorId) duplicateQuery.conveyorId = conveyorId;
  else duplicateQuery.$or = [{ conveyorId: null }, { conveyorId: { $exists: false } }];

  const existing = await TimeBlockConfiguration.findOne(duplicateQuery).lean();

  if (existing) throw new Error("An active time-block configuration already exists for this Location / Plant / Shift / Conveyor");

  const configuration = await TimeBlockConfiguration.create({
    locationId: organization.location._id,
    locationName: organization.location.locationName,
    plantId: organization.plant._id,
    plantName: organization.plant.plantName,
    shiftId: organization.shift._id,
    shiftName: organization.shift.shiftName,
    conveyorId: conveyorId || null,
    conveyorName: organization.conveyorName,
    blockType,
    blocks: normalizedBlocks,
    status,
    createdBy: createdBy || undefined,
  });

  return configuration;
};

/* =========================================================
   GET ALL CONFIGURATIONS
========================================================= */

export const getAllTimeBlockConfigurations = async (filters = {}) => {
  const query = {};

  if (filters.locationId) query.locationId = filters.locationId;
  if (filters.plantId) query.plantId = filters.plantId;
  if (filters.shiftId) query.shiftId = filters.shiftId;
  if (filters.conveyorId) query.conveyorId = filters.conveyorId;
  if (filters.blockType) query.blockType = filters.blockType;
  if (filters.status) query.status = filters.status;

  return TimeBlockConfiguration.find(query)
    .populate("locationId", "locationName locationCode")
    .populate("plantId", "plantName plantCode")
    .populate("shiftId", "shiftName shiftType shiftStartTime shiftEndTime")
    .sort({ locationName: 1, plantName: 1, shiftName: 1, conveyorName: 1 })
    .lean();
};

/* =========================================================
   GET BY ID
========================================================= */

export const getTimeBlockConfigurationById = async (id) => {
  if (!isValidId(id)) throw new Error("Invalid Time Block Configuration ID");

  const configuration = await TimeBlockConfiguration.findById(id)
    .populate("locationId", "locationName locationCode")
    .populate("plantId", "plantName plantCode")
    .populate("shiftId", "shiftName shiftType shiftStartTime shiftEndTime")
    .lean();

  if (!configuration) throw new Error("Time block configuration not found");

  return configuration;
};

/* =========================================================
   GET ACTIVE CONFIGURATION
========================================================= */

export const getActiveTimeBlockConfiguration = async ({
  locationId,
  plantId,
  shiftId,
  conveyorId = null,
}) => {
  if (!isValidId(locationId)) throw new Error("Valid Location is required");
  if (!isValidId(plantId)) throw new Error("Valid Plant is required");
  if (!isValidId(shiftId)) throw new Error("Valid Shift is required");

  const query = {
    locationId,
    plantId,
    shiftId,
    status: "Active",
  };

  if (conveyorId) query.conveyorId = conveyorId;
  else query.$or = [{ conveyorId: null }, { conveyorId: { $exists: false } }];

  return TimeBlockConfiguration.findOne(query)
    .populate("shiftId", "shiftName shiftType shiftStartTime shiftEndTime actualWorkingMinutes")
    .lean();
};

/* =========================================================
   UPDATE CONFIGURATION
========================================================= */

export const updateTimeBlockConfiguration = async (id, payload = {}) => {
  if (!isValidId(id)) throw new Error("Invalid Time Block Configuration ID");

  const existing = await TimeBlockConfiguration.findById(id);

  if (!existing) throw new Error("Time block configuration not found");

  const {
    locationId = existing.locationId,
    plantId = existing.plantId,
    shiftId = existing.shiftId,
    conveyorId = existing.conveyorId,
    blockType = existing.blockType,
    blocks = existing.blocks,
    status = existing.status,
    updatedBy = null,
  } = payload;

  const organization = await validateOrganization({ locationId, plantId, shiftId, conveyorId });

  const normalizedBlocks = validateBlocks(blocks);

  if (!normalizedBlocks.length) throw new Error("At least one time block is required");

  const duplicateQuery = {
    _id: { $ne: id },
    locationId,
    plantId,
    shiftId,
    status: "Active",
  };

  if (conveyorId) duplicateQuery.conveyorId = conveyorId;
  else duplicateQuery.$or = [{ conveyorId: null }, { conveyorId: { $exists: false } }];

  const duplicate = await TimeBlockConfiguration.findOne(duplicateQuery).lean();

  if (duplicate && status === "Active") throw new Error("Another active configuration already exists for this Location / Plant / Shift / Conveyor");

  existing.locationId = organization.location._id;
  existing.locationName = organization.location.locationName;
  existing.plantId = organization.plant._id;
  existing.plantName = organization.plant.plantName;
  existing.shiftId = organization.shift._id;
  existing.shiftName = organization.shift.shiftName;
  existing.conveyorId = conveyorId || null;
  existing.conveyorName = organization.conveyorName;
  existing.blockType = blockType;
  existing.blocks = normalizedBlocks;
  existing.status = status;

  if (updatedBy) existing.updatedBy = updatedBy;

  await existing.save();

  return existing;
};

/* =========================================================
   ACTIVATE / DEACTIVATE
========================================================= */

export const toggleTimeBlockConfigurationStatus = async (id) => {
  if (!isValidId(id)) throw new Error("Invalid Time Block Configuration ID");

  const configuration = await TimeBlockConfiguration.findById(id);

  if (!configuration) throw new Error("Time block configuration not found");

  const newStatus = configuration.status === "Active" ? "Inactive" : "Active";

  if (newStatus === "Active") {
    const duplicateQuery = {
      _id: { $ne: id },
      locationId: configuration.locationId,
      plantId: configuration.plantId,
      shiftId: configuration.shiftId,
      status: "Active",
    };

    if (configuration.conveyorId) duplicateQuery.conveyorId = configuration.conveyorId;
    else duplicateQuery.$or = [{ conveyorId: null }, { conveyorId: { $exists: false } }];

    const duplicate = await TimeBlockConfiguration.findOne(duplicateQuery).lean();

    if (duplicate) throw new Error("Another active configuration already exists for this Location / Plant / Shift / Conveyor");
  }

  configuration.status = newStatus;

  await configuration.save();

  return configuration;
};

/* =========================================================
   DELETE CONFIGURATION
========================================================= */

export const deleteTimeBlockConfiguration = async (id) => {
  if (!isValidId(id)) throw new Error("Invalid Time Block Configuration ID");

  const deleted = await TimeBlockConfiguration.findByIdAndDelete(id);

  if (!deleted) throw new Error("Time block configuration not found");

  return deleted;
};

/* =========================================================
   CALCULATE REAL CLOCK TIME FOR BLOCKS
========================================================= */

export const getResolvedBlocks = async (configurationId) => {
  const configuration = await getTimeBlockConfigurationById(configurationId);

  const shift = await Shift.findById(configuration.shiftId).lean();

  if (!shift) throw new Error("Shift not found");

  const shiftStart = shift.shiftStartTime;

  const [startHour, startMinute] = shiftStart.split(":").map(Number);

  const baseDate = new Date();
  baseDate.setHours(startHour, startMinute, 0, 0);

  return configuration.blocks
    .filter((block) => block.active !== false)
    .map((block) => {
      const start = new Date(baseDate.getTime() + block.startOffsetMinutes * 60000);
      const end = new Date(baseDate.getTime() + block.endOffsetMinutes * 60000);

      return {
        ...block,
        startTime: start,
        endTime: end,
        startClockTime: start.toTimeString().slice(0, 5),
        endClockTime: end.toTimeString().slice(0, 5),
      };
    });
};

/* =========================================================
   FIND BLOCK FOR A TIMESTAMP
========================================================= */

export const findTimeBlockForTimestamp = async (configurationId, timestamp = new Date()) => {
  const resolvedBlocks = await getResolvedBlocks(configurationId);
  const target = toDate(timestamp);

  if (!target) throw new Error("Invalid timestamp");

  return resolvedBlocks.find((block) => target >= block.startTime && target < block.endTime) || null;
};

/* =========================================================
   CALCULATE SESSION BLOCK OVERLAP
========================================================= */

export const calculateSessionBlockOverlap = async ({
  configurationId,
  startTime,
  endTime,
  productionQty = 0,
}) => {
  const start = toDate(startTime);
  const end = toDate(endTime);

  if (!start || !end || end <= start) return [];

  const blocks = await getResolvedBlocks(configurationId);

  return blocks
    .filter((block) => start < block.endTime && end > block.startTime)
    .map((block) => {
      const overlapStart = new Date(Math.max(start.getTime(), block.startTime.getTime()));
      const overlapEnd = new Date(Math.min(end.getTime(), block.endTime.getTime()));
      const overlapMinutes = Math.max((overlapEnd - overlapStart) / 60000, 0);
      const blockRatio = block.durationMinutes > 0 ? overlapMinutes / block.durationMinutes : 0;

      return {
        blockId: block._id,
        blockNumber: block.blockNumber,
        blockName: block.blockName,
        startTime: block.startTime,
        endTime: block.endTime,
        overlapStart,
        overlapEnd,
        overlapMinutes: Number(overlapMinutes.toFixed(2)),
        blockRatio: Number(blockRatio.toFixed(4)),
        allocatedProductionQty: Number((toNumber(productionQty) * blockRatio).toFixed(2)),
      };
    });
};

/* =========================================================
   GET CURRENT BLOCK
========================================================= */

export const getCurrentTimeBlock = async ({
  configurationId,
  timestamp = new Date(),
}) => {
  const block = await findTimeBlockForTimestamp(configurationId, timestamp);

  return {
    timestamp: new Date(timestamp),
    block,
  };
};

/* =========================================================
   GET BLOCK PERFORMANCE TEMPLATE
   Actual production data will be joined later by
   productionSession / liveAnalysis service.
========================================================= */

export const getTimeBlockPerformanceTemplate = async ({
  configurationId,
  timestamp = new Date(),
}) => {
  const blocks = await getResolvedBlocks(configurationId);
  const currentTime = toDate(timestamp);

  return blocks.map((block) => ({
    blockId: block._id,
    blockNumber: block.blockNumber,
    blockName: block.blockName,
    startTime: block.startTime,
    endTime: block.endTime,
    durationMinutes: block.durationMinutes,
    active: block.active !== false,
    isCurrent: currentTime >= block.startTime && currentTime < block.endTime,
    productionQty: 0,
    targetQty: 0,
    achievementPercent: 0,
    averageProductionRate: 0,
    downtimeMinutes: 0,
    runningMinutes: 0,
  }));
};

