import mongoose from "mongoose";
import ProductionSession from "../models/productionSession.model.js";
import TimeBlockConfiguration from "../models/timeBlockConfiguration.model.js";
import ShiftRuntime from "../models/shiftRuntime.model.js";
import Shift from "../models/shift.model.js";
import ConveyorStrength from "../models/ConveyorStrength.model.js";
import Model from "../models/models.model.js";
import Part from "../models/parts.model.js";
import User from "../models/users.model.js";
import { calculateSessionTiming, calculateTimeBlockOverlap } from "../utils/productionTime.utils.js";

/* ========================================================
   BASIC HELPERS
========================================================= */

const toId = (value) => value ? new mongoose.Types.ObjectId(value) : null;

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((num(value) + Number.EPSILON) * factor) / factor;
};

const normalizeParts = (parts = []) => {
  if (!Array.isArray(parts)) return [];

  return parts.map((item) => ({
    partId: item.partId,
    partName: item.partName || "",
    quantity: Math.max(num(item.quantity), 0),
  }));
};

const calculateTotalQuantity = (parts = []) => parts.reduce((sum, item) => sum + num(item.quantity), 0);

const calculateAverageRate = (totalQuantity, runningMinutes) => {
  const qty = num(totalQuantity);
  const minutes = num(runningMinutes);

  if (minutes <= 0) return 0;

  return round(qty / minutes, 2);
};

const calculateAchievement = (totalQuantity, demandPerShift) => {
  const qty = num(totalQuantity);
  const demand = num(demandPerShift);

  if (demand <= 0) return 0;

  return Math.min(round((qty / demand) * 100, 2), 100);
};

/* =========================================================
   VALIDATION
========================================================= */

const validateObjectId = (value, fieldName) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`${fieldName} is required or invalid`);
    error.statusCode = 400;
    throw error;
  }
};

/* =========================================================
   GET MASTER DATA
========================================================= */

const getSessionContext = async ({ userId, shiftId, conveyorStrengthId }) => {
  validateObjectId(userId, "User");
  validateObjectId(shiftId, "Shift");

  const [user, selectedShift] = await Promise.all([
    User.findById(userId).populate("plantId").lean(),
    Shift.findById(shiftId).lean(),
  ]);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.plantId) {
    const error = new Error("User does not have a plant assigned");
    error.statusCode = 400;
    throw error;
  }

  if (!selectedShift) {
    const error = new Error("Shift not found");
    error.statusCode = 404;
    throw error;
  }

  let strength = null;

  if (conveyorStrengthId) {
    validateObjectId(conveyorStrengthId, "Conveyor Strength");

    strength = await ConveyorStrength.findById(conveyorStrengthId).lean();

    if (!strength) {
      const error = new Error("Conveyor strength configuration not found");
      error.statusCode = 404;
      throw error;
    }
  }

  return { user, selectedShift, strength };
};

/* =========================================================
   START PRODUCTION SESSION
========================================================= */

export const startProductionSession = async ({
  userId,
  modelId,
  shiftId,
  conveyorStrengthId = null,
  startTime = new Date(),
}) => {
  validateObjectId(userId, "User");
  validateObjectId(modelId, "Model");
  validateObjectId(shiftId, "Shift");

  const existingLive = await ProductionSession.findOne({
    reportedBy: userId,
    modelId,
    shiftId,
    status: "Running",
  });

  if (existingLive) {
    const error = new Error("This model already has an active production session");
    error.statusCode = 409;
    throw error;
  }

  const [{ user, selectedShift, strength }, selectedModel] = await Promise.all([
    getSessionContext({ userId, shiftId, conveyorStrengthId }),
    Model.findById(modelId).lean(),
  ]);

  if (!selectedModel) {
    const error = new Error("Model not found");
    error.statusCode = 404;
    throw error;
  }

  const actualStartTime = new Date(startTime);

  if (Number.isNaN(actualStartTime.getTime())) {
    const error = new Error("Invalid start time");
    error.statusCode = 400;
    throw error;
  }

  const demandPerShift = num(strength?.demandPerShift);
  const targetPerSession = demandPerShift;

  const session = await ProductionSession.create({
    reportedBy: user._id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,

    plantId: user.plantId._id,
    plantName: user.plantId.plantName,

    locationId: user.plantId.locationId,
    locationName: user.plantId.locationName,

    shiftId: selectedShift._id,
    shiftName: selectedShift.shiftName,

    modelId: selectedModel._id,
    modelName: selectedModel.modelName,

    conveyorStrengthId: strength?._id || null,
    conveyorId: strength?.conveyorId || user.conveyorId || null,
    conveyorName: strength?.conveyorName || "",

    startTime: actualStartTime,
    endTime: null,

    durationMinutes: 0,
    downtimeMinutes: 0,
    runningMinutes: 0,

    totalProductionQty: 0,
    averageProductionRate: 0,

    demandPerShift,
    targetPerSession,

    achievementPercent: 0,

    parts: [],

    status: "Running",
  });

  return session;
};

/* =========================================================
   UPDATE PART QUANTITIES
   Called while the model is still running.
========================================================= */

export const updateProductionSessionParts = async ({
  sessionId,
  parts = [],
}) => {
  validateObjectId(sessionId, "Production Session");

  const session = await ProductionSession.findById(sessionId);

  if (!session) {
    const error = new Error("Production session not found");
    error.statusCode = 404;
    throw error;
  }

  if (session.status !== "Running") {
    const error = new Error("Only running production sessions can be updated");
    error.statusCode = 400;
    throw error;
  }

  const normalizedParts = normalizeParts(parts);

  const partIds = normalizedParts
    .map((item) => item.partId)
    .filter(Boolean);

  if (partIds.length) {
    const existingParts = await Part.find({
      _id: { $in: partIds },
    }).lean();

    const validPartIds = new Set(existingParts.map((item) => String(item._id)));

    for (const item of normalizedParts) {
      if (!validPartIds.has(String(item.partId))) {
        const error = new Error(`Part not found: ${item.partId}`);
        error.statusCode = 404;
        throw error;
      }
    }
  }

  const totalProductionQty = calculateTotalQuantity(normalizedParts);

  const now = new Date();

  const timing = calculateSessionTiming({
    startTime: session.startTime,
    endTime: now,
    downtimes: session.downtimes || [],
  });

  const averageProductionRate = calculateAverageRate(
    totalProductionQty,
    timing.runningMinutes,
  );

  const achievementPercent = calculateAchievement(
    totalProductionQty,
    session.demandPerShift,
  );

  session.parts = normalizedParts;
  session.totalProductionQty = totalProductionQty;
  session.durationMinutes = timing.durationMinutes;
  session.downtimeMinutes = timing.downtimeMinutes;
  session.runningMinutes = timing.runningMinutes;
  session.averageProductionRate = averageProductionRate;
  session.achievementPercent = achievementPercent;

  await session.save();

  return session;
};

/* =========================================================
   ADD / UPDATE DOWNTIME DURING LIVE SESSION
========================================================= */

export const updateProductionSessionDowntime = async ({
  sessionId,
  downtimes = [],
}) => {
  validateObjectId(sessionId, "Production Session");

  const session = await ProductionSession.findById(sessionId);

  if (!session) {
    const error = new Error("Production session not found");
    error.statusCode = 404;
    throw error;
  }

  if (session.status !== "Running") {
    const error = new Error("Only running sessions can receive downtime updates");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  const timing = calculateSessionTiming({
    startTime: session.startTime,
    endTime: now,
    downtimes,
  });

  const totalProductionQty = calculateTotalQuantity(session.parts || []);

  session.downtimes = downtimes;
  session.durationMinutes = timing.durationMinutes;
  session.downtimeMinutes = timing.downtimeMinutes;
  session.runningMinutes = timing.runningMinutes;
  session.totalProductionQty = totalProductionQty;

  session.averageProductionRate = calculateAverageRate(
    totalProductionQty,
    timing.runningMinutes,
  );

  session.achievementPercent = calculateAchievement(
    totalProductionQty,
    session.demandPerShift,
  );

  await session.save();

  return session;
};

/* =========================================================
   GET LIVE SESSION
========================================================= */

export const getLiveProductionSession = async ({
  userId,
  plantId,
  shiftId,
  conveyorId,
}) => {
  const query = {
    status: "Running",
  };

  if (userId) query.reportedBy = userId;
  if (plantId) query.plantId = plantId;
  if (shiftId) query.shiftId = shiftId;
  if (conveyorId) query.conveyorId = conveyorId;

  const sessions = await ProductionSession.find(query)
    .populate("modelId", "modelName")
    .populate("shiftId", "shiftName shiftStartTime shiftEndTime")
    .sort({ startTime: -1 })
    .lean();

  return sessions;
};

/* =========================================================
   GET SINGLE SESSION
========================================================= */

export const getProductionSessionById = async (sessionId) => {
  validateObjectId(sessionId, "Production Session");

  const session = await ProductionSession.findById(sessionId)
    .populate("reportedBy", "name email role")
    .populate("modelId", "modelName")
    .populate("shiftId", "shiftName shiftType shiftStartTime shiftEndTime")
    .lean();

  if (!session) {
    const error = new Error("Production session not found");
    error.statusCode = 404;
    throw error;
  }

  return session;
};

/* =========================================================
   COMPLETE PRODUCTION SESSION
========================================================= */

export const completeProductionSession = async ({
  sessionId,
  parts,
  endTime = new Date(),
}) => {
  validateObjectId(sessionId, "Production Session");

  const session = await ProductionSession.findById(sessionId);

  if (!session) {
    const error = new Error("Production session not found");
    error.statusCode = 404;
    throw error;
  }

  if (session.status !== "Running") {
    const error = new Error("Production session is already completed");
    error.statusCode = 400;
    throw error;
  }

  const actualEndTime = new Date(endTime);

  if (Number.isNaN(actualEndTime.getTime())) {
    const error = new Error("Invalid end time");
    error.statusCode = 400;
    throw error;
  }

  if (actualEndTime <= new Date(session.startTime)) {
    const error = new Error("End time must be after start time");
    error.statusCode = 400;
    throw error;
  }

  if (parts !== undefined) {
    session.parts = normalizeParts(parts);
  }

  const finalParts = session.parts || [];

  const totalProductionQty = calculateTotalQuantity(finalParts);

  const timing = calculateSessionTiming({
    startTime: session.startTime,
    endTime: actualEndTime,
    downtimes: session.downtimes || [],
  });

  const averageProductionRate = calculateAverageRate(
    totalProductionQty,
    timing.runningMinutes,
  );

  const achievementPercent = calculateAchievement(
    totalProductionQty,
    session.demandPerShift,
  );

  let timeBlockOverlap = [];

  if (session.timeBlockConfigurationId) {
    timeBlockOverlap = await calculateTimeBlockOverlap({
      configurationId: session.timeBlockConfigurationId,
      startTime: session.startTime,
      endTime: actualEndTime,
      productionQty: totalProductionQty,
    });
  }

  session.parts = finalParts;
  session.endTime = actualEndTime;

  session.durationMinutes = timing.durationMinutes;
  session.downtimeMinutes = timing.downtimeMinutes;
  session.runningMinutes = timing.runningMinutes;

  session.totalProductionQty = totalProductionQty;
  session.averageProductionRate = averageProductionRate;
  session.achievementPercent = achievementPercent;

  session.timeBlockOverlap = timeBlockOverlap;

  session.status = "Completed";

  await session.save();

  return session;
};

/* =========================================================
   CANCEL SESSION
========================================================= */

export const cancelProductionSession = async ({
  sessionId,
  reason = "",
}) => {
  validateObjectId(sessionId, "Production Session");

  const session = await ProductionSession.findById(sessionId);

  if (!session) {
    const error = new Error("Production session not found");
    error.statusCode = 404;
    throw error;
  }

  if (session.status === "Completed") {
    const error = new Error("Completed production session cannot be cancelled");
    error.statusCode = 400;
    throw error;
  }

  session.status = "Cancelled";
  session.cancelReason = reason;
  session.endTime = new Date();

  const timing = calculateSessionTiming({
    startTime: session.startTime,
    endTime: session.endTime,
    downtimes: session.downtimes || [],
  });

  session.durationMinutes = timing.durationMinutes;
  session.downtimeMinutes = timing.downtimeMinutes;
  session.runningMinutes = timing.runningMinutes;

  await session.save();

  return session;
};

/* =========================================================
   GET SESSION HISTORY
========================================================= */

export const getProductionSessions = async ({
  plantId,
  locationId,
  shiftId,
  modelId,
  conveyorId,
  status,
  from,
  to,
}) => {
  const query = {};

  if (plantId) query.plantId = plantId;
  if (locationId) query.locationId = locationId;
  if (shiftId) query.shiftId = shiftId;
  if (modelId) query.modelId = modelId;
  if (conveyorId) query.conveyorId = conveyorId;
  if (status) query.status = status;

  if (from || to) {
    query.startTime = {};

    if (from) query.startTime.$gte = new Date(from);
    if (to) query.startTime.$lte = new Date(to);
  }

  return ProductionSession.find(query)
    .populate("modelId", "modelName")
    .populate("shiftId", "shiftName")
    .sort({ startTime: -1 })
    .lean();
};

/* =========================================================
   GET SESSION PERFORMANCE
========================================================= */

export const getSessionPerformance = async (sessionId) => {
  const session = await getProductionSessionById(sessionId);

  const totalQuantity = num(session.totalProductionQty);
  const durationMinutes = num(session.durationMinutes);
  const downtimeMinutes = num(session.downtimeMinutes);
  const runningMinutes = Math.max(durationMinutes - downtimeMinutes, 0);

  return {
    sessionId: session._id,

    modelId: session.modelId?._id || session.modelId,
    modelName: session.modelId?.modelName || session.modelName,

    startTime: session.startTime,
    endTime: session.endTime,

    durationMinutes,
    downtimeMinutes,
    runningMinutes,

    totalProductionQty: totalQuantity,

    averageProductionRate: calculateAverageRate(
      totalQuantity,
      runningMinutes,
    ),

    demandPerShift: num(session.demandPerShift),

    achievementPercent: calculateAchievement(
      totalQuantity,
      session.demandPerShift,
    ),

    status: session.status,

    parts: session.parts || [],
  };
};

/* =========================================================
   LIVE SNAPSHOT
   Used later by Live Analysis page.
========================================================= */

export const getLiveAnalysisSnapshot = async ({
  plantId,
  shiftId,
  conveyorId,
}) => {
  const sessions = await getLiveProductionSession({
    plantId,
    shiftId,
    conveyorId,
  });

  const now = new Date();

  const data = sessions.map((session) => {
    const timing = calculateSessionTiming({
      startTime: session.startTime,
      endTime: now,
      downtimes: session.downtimes || [],
    });

    const totalProductionQty = calculateTotalQuantity(
      session.parts || [],
    );

    return {
      sessionId: session._id,

      modelId: session.modelId?._id || session.modelId,
      modelName: session.modelId?.modelName || session.modelName,

      shiftId: session.shiftId?._id || session.shiftId,
      shiftName: session.shiftId?.shiftName || session.shiftName,

      startTime: session.startTime,

      elapsedMinutes: timing.durationMinutes,

      downtimeMinutes: timing.downtimeMinutes,

      runningMinutes: timing.runningMinutes,

      totalProductionQty,

      averageProductionRate: calculateAverageRate(
        totalProductionQty,
        timing.runningMinutes,
      ),

      demandPerShift: num(session.demandPerShift),

      achievementPercent: calculateAchievement(
        totalProductionQty,
        session.demandPerShift,
      ),

      status: session.status,
    };
  });

  return data;
};

