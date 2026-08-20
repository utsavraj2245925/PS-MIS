import mongoose from "mongoose";

import ProductionSession from "../models/productionSession.model.js";
import Shift from "../models/shift.model.js";
import Plant from "../models/plants.model.js";
import ConveyorStrength from "../models/ConveyorStrength.model.js";

import {
  getCurrentTimeBlock,
  calculateProductionRate,
  calculateAchievement,
  calculateDowntimeAdjustedMinutes,
  calculateDurationMinutes,
} from "../utils/productionTime.utils.js";

import {
  buildShiftTimeline,
  getCurrentLiveBlock,
  getUpcomingBlocks as getTimelineUpcomingBlocks,
  getShiftStatus,
  calculateShiftElapsed,
  calculateShiftRemaining,
} from "../utils/liveBlock.utils.js";

/* ============================================================
   HELPERS
============================================================ */

const toObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const num = (value) => Number(value || 0);

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((num(value) + Number.EPSILON) * factor) / factor;
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const minutesSince = (startTime, now = new Date()) => {
  const start = safeDate(startTime);
  if (!start) return 0;
  return Math.max(Math.round((now - start) / 60000), 0);
};

const formatDuration = (minutes = 0) => {
  const total = Math.max(Math.round(num(minutes)), 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
};

const getSessionQuantity = (session) => {
  if (session?.totalQuantity !== undefined) return num(session.totalQuantity);
  if (session?.totalProductionQty !== undefined) return num(session.totalProductionQty);
  if (session?.productionQty !== undefined) return num(session.productionQty);

  if (Array.isArray(session?.parts)) {
    return session.parts.reduce((sum, part) => sum + num(part.quantity), 0);
  }

  if (Array.isArray(session?.productions)) {
    return session.productions.reduce((sum, row) => sum + num(row.productionQty), 0);
  }

  return 0;
};

const getSessionDowntime = (session) => {
  if (session?.totalDowntime !== undefined) return num(session.totalDowntime);
  if (session?.downtimeMinutes !== undefined) return num(session.downtimeMinutes);

  if (Array.isArray(session?.downtimes)) {
    return session.downtimes.reduce((sum, item) => sum + num(item.duration || item.durationMinutes), 0);
  }

  return 0;
};

const getSessionStart = (session) => {
  return session?.startTime || session?.startedAt || session?.modelStartTime || null;
};

const getSessionEnd = (session) => {
  return session?.endTime || session?.completedAt || session?.modelEndTime || null;
};

/* ============================================================
   RESOLVE ORGANIZATION
============================================================ */

export const resolveLiveScope = async ({ locationId, plantId, shiftId, conveyorId }) => {
  const locationObjectId = toObjectId(locationId);
  const plantObjectId = toObjectId(plantId);
  const shiftObjectId = toObjectId(shiftId);
  const conveyorObjectId = toObjectId(conveyorId);

  if (!plantObjectId) throw new Error("Plant is required");
  if (!shiftObjectId) throw new Error("Shift is required");

  const plant = await Plant.findById(plantObjectId).lean();

  if (!plant) {
    const error = new Error("Plant not found");
    error.statusCode = 404;
    throw error;
  }

  const selectedShift = await Shift.findById(shiftObjectId).lean();

  if (!selectedShift) {
    const error = new Error("Shift not found");
    error.statusCode = 404;
    throw error;
  }

  if (locationObjectId && plant.locationId && String(plant.locationId) !== String(locationObjectId)) {
    const error = new Error("Selected plant does not belong to selected location");
    error.statusCode = 400;
    throw error;
  }

  return {
    locationId: locationObjectId || plant.locationId || null,
    locationName: plant.locationName || "",
    plantId: plant._id,
    plantName: plant.plantName || "",
    shiftId: selectedShift._id,
    shiftName: selectedShift.shiftName || "",
    conveyorId: conveyorObjectId || null,
    conveyorName: "",
    shift: selectedShift,
  };
};


/* ============================================================
   BUILD LIVE SHIFT RUNTIME FROM SHIFT MASTER
============================================================ */

export const getLiveShiftRuntime = async ({
  plantId,
  shiftId,
  date,
  now = new Date(),
}) => {
  const plantObjectId = toObjectId(plantId);
  const shiftObjectId = toObjectId(shiftId);

  if (!plantObjectId || !shiftObjectId) {
    return null;
  }

  const shift = await Shift.findOne({
    _id: shiftObjectId,
    plantId: plantObjectId,
    status: "Active",
  }).lean();

  if (!shift) {
    return null;
  }

  const selectedDate = new Date(date || now);

  selectedDate.setHours(0, 0, 0, 0);

  const shiftStart = new Date(selectedDate);
  const shiftEnd = new Date(selectedDate);

  const [startHour, startMinute] = String(
    shift.shiftStartTime || "00:00"
  )
    .split(":")
    .map(Number);

  const [endHour, endMinute] = String(
    shift.shiftEndTime || "00:00"
  )
    .split(":")
    .map(Number);

  shiftStart.setHours(
    Number.isFinite(startHour) ? startHour : 0,
    Number.isFinite(startMinute) ? startMinute : 0,
    0,
    0
  );

  shiftEnd.setHours(
    Number.isFinite(endHour) ? endHour : 0,
    Number.isFinite(endMinute) ? endMinute : 0,
    0,
    0
  );

  // Overnight shift
  if (shiftEnd <= shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  let status = "NotStarted";

  if (now >= shiftStart && now < shiftEnd) {
    status = "Running";
  } else if (now >= shiftEnd) {
    status = "Completed";
  }

  return {
    _id: null,

    locationId: shift.locationId,
    plantId: shift.plantId,
    shiftId: shift._id,

    status,

    shiftStartTime: shiftStart,
    shiftEndTime: shiftEnd,

    // Compatibility with your existing code
    actualStartTime: shiftStart,
    actualEndTime: status === "Completed" ? shiftEnd : null,

    shift,
  };
};

/* ============================================================
   GET LIVE PRODUCTION SESSIONS
============================================================ */

export const getLiveSessions = async ({ plantId, shiftId, conveyorId, date }) => {
  const filter = {
    plantId: toObjectId(plantId),
    shiftId: toObjectId(shiftId),
  };

  if (conveyorId) filter.conveyorId = toObjectId(conveyorId);

  const selectedDate = new Date(date || new Date());
  selectedDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);

  filter.createdAt = { $gte: selectedDate, $lt: nextDate };

  return ProductionSession.find(filter).sort({ startTime: 1, createdAt: 1 }).lean();
};

/* ============================================================
   GET CURRENT SESSION
============================================================ */

export const getCurrentProductionSession = (sessions = []) => {
  const live = sessions.filter((session) => {
    const status = String(session.status || "").toLowerCase();

    return (
      status === "running" ||
      status === "active" ||
      status === "inprogress" ||
      status === "in progress"
    );
  });

  if (!live.length) return null;

  return live.sort((a, b) => {
    const aTime = new Date(getSessionStart(a) || 0).getTime();
    const bTime = new Date(getSessionStart(b) || 0).getTime();
    return bTime - aTime;
  })[0];
};

/* ============================================================
   CALCULATE SESSION LIVE PERFORMANCE
============================================================ */

export const calculateLiveSessionPerformance = (session, now = new Date()) => {
  if (!session) return null;

  const startTime = safeDate(getSessionStart(session));
  const endTime = safeDate(getSessionEnd(session));

  if (!startTime) return null;

  const effectiveEndTime = endTime || now;

  const elapsedMinutes = calculateDurationMinutes(
    startTime,
    effectiveEndTime
  );

  const downtimeMinutes = getSessionDowntime(session);

  const runningMinutes = calculateDowntimeAdjustedMinutes(
    startTime,
    effectiveEndTime,
    downtimeMinutes
  );

  const quantity = getSessionQuantity(session);

  const averageProductionRate = calculateProductionRate({
    quantity,
    runningMinutes,
  });

  const target = num(
    session.target ||
    session.demandPerShift ||
    session.targetQuantity
  );

  const achievement = calculateAchievement({
    productionQty: quantity,
    targetQty: target,
  });

  return {
    quantity: round(quantity),
    target: round(target),
    achievementPercent: round(achievement),
    startTime,
    endTime,
    elapsedMinutes,
    elapsedTime: formatDuration(elapsedMinutes),
    downtimeMinutes,
    runningMinutes,
    runningTime: formatDuration(runningMinutes),
    averageProductionRate: round(averageProductionRate),
    isRunning: !endTime,
  };
};

/* ============================================================
   CALCULATE BLOCK PERFORMANCE
============================================================ */

export const calculateBlockPerformance = ({
  block,
  sessions = [],
  now = new Date(),
}) => {
  if (!block) return null;

  const blockStart = safeDate(block.startTime);
  const blockEnd = safeDate(block.endTime);

  if (!blockStart || !blockEnd) return null;

  const overlappingSessions = sessions
    .map((session) => {
      const sessionStart = safeDate(getSessionStart(session));
      const sessionEnd = safeDate(getSessionEnd(session)) || now;

      if (!sessionStart) return null;

      const overlapStart = Math.max(
        sessionStart.getTime(),
        blockStart.getTime()
      );

      const overlapEnd = Math.min(
        sessionEnd.getTime(),
        blockEnd.getTime()
      );

      const overlapMinutes = overlapEnd > overlapStart
        ? Math.round((overlapEnd - overlapStart) / 60000)
        : 0;

      if (overlapMinutes <= 0) return null;

      return { session, overlapMinutes };
    })
    .filter(Boolean);

  const production = overlappingSessions.reduce(
    (sum, item) => sum + getSessionQuantity(item.session),
    0
  );

  const downtime = overlappingSessions.reduce(
    (sum, item) => sum + getSessionDowntime(item.session),
    0
  );

  const blockElapsedMinutes = Math.max(
    Math.round(
      (Math.min(now.getTime(), blockEnd.getTime()) -
        blockStart.getTime()) / 60000
    ),
    0
  );

  const runningMinutes = Math.max(
    blockElapsedMinutes - downtime,
    0
  );

  const target = overlappingSessions.reduce(
    (sum, item) =>
      sum +
      num(
        item.session.target ||
        item.session.demandPerShift ||
        item.session.targetQuantity
      ),
    0
  );

  const averageProductionRate = calculateProductionRate({
    quantity: production,
    runningMinutes,
  });

  const achievementPercent = calculateAchievement({
    productionQty: production,
    targetQty: target,
  });

  return {
    blockId: block.blockId || block._id || null,
    blockNumber: block.blockNumber,
    blockName: block.blockName,

    startTime: blockStart,
    endTime: blockEnd,

    durationMinutes: Math.max(
      Math.round((blockEnd - blockStart) / 60000),
      0
    ),

    elapsedMinutes: blockElapsedMinutes,

    remainingMinutes: Math.max(
      Math.round((blockEnd.getTime() - now.getTime()) / 60000),
      0
    ),

    production: round(production),
    target: round(target),

    achievementPercent: round(
      achievementPercent
    ),

    downtimeMinutes: downtime,
    runningMinutes,

    averageProductionRate: round(
      averageProductionRate
    ),

    overlappingSessionCount:
      overlappingSessions.length,
  };
};

/* ============================================================
   BUILD CURRENT BLOCK
============================================================ */

export const buildCurrentBlock = ({
  shift,
  now = new Date(),
}) => {
  if (!shift) return null;

  const timeline = buildShiftTimeline({
    shift,
    baseDate: now,
  });

  return getCurrentLiveBlock({
    timeline: timeline.timeline,
    currentTime: now,
  });
};

/* ============================================================
   BUILD ALL BLOCK PERFORMANCE
============================================================ */

export const buildBlockPerformance = ({
  shift,
  sessions = [],
  now = new Date(),
}) => {
  if (!shift) return [];

  const shiftTimeline = buildShiftTimeline({
    shift,
    baseDate: now,
  });

  return shiftTimeline.timeline.map((block) => {
    const productionSessions = sessions.filter((session) => {
      const sessionStart = safeDate(getSessionStart(session));
      const sessionEnd =
        safeDate(getSessionEnd(session)) || now;

      if (!sessionStart) return false;

      return (
        sessionStart < block.endTime &&
        sessionEnd > block.startTime
      );
    });

    const productionQty = productionSessions.reduce(
      (sum, session) =>
        sum + getSessionQuantity(session),
      0
    );

    return {
      blockNumber: block.blockNumber ?? null,
      blockLabel: block.blockName,
      blockType: block.type,

      startTime: block.startTime,
      endTime: block.endTime,

      durationMinutes: block.durationMinutes,

      productionQty,

      productionRatePerHour:
        block.durationMinutes > 0
          ? round(
              (productionQty / block.durationMinutes) * 60,
              2
            )
          : 0,

      downtimeMinutes: 0,

      runningMinutes: block.isBreak
        ? 0
        : block.durationMinutes,

      isBreak: block.isBreak,
      active: true,
    };
  });
};

/* ============================================================
   GET UPCOMING BLOCKS
============================================================ */

export const getUpcomingBlocks = ({
  shift,
  now = new Date(),
}) => {
  if (!shift) return [];

  const timeline = buildShiftTimeline({
    shift,
    baseDate: now,
  });

  return getTimelineUpcomingBlocks({
    timeline: timeline.timeline,
    currentTime: now,
  });
};

/* ============================================================
   BUILD SESSION TIMELINE
============================================================ */

export const buildSessionTimeline = ({
  sessions = [],
  now = new Date(),
}) => {
  return sessions.map((session) => {
    const startTime = safeDate(getSessionStart(session));
    const endTime = safeDate(getSessionEnd(session)) || now;

    const performance = calculateLiveSessionPerformance(session, now);

    return {
      sessionId: session._id,
      modelId: session.modelId || null,
      modelName: session.modelName || session.model?.modelName || "Unknown Model",
      startTime,
      endTime: safeDate(getSessionEnd(session)),
      durationMinutes: performance?.elapsedMinutes || 0,
      duration: performance?.elapsedTime || "0h 00m",
      productionQty: performance?.quantity || 0,
      averageProductionRate: performance?.averageProductionRate || 0,
      downtimeMinutes: performance?.downtimeMinutes || 0,
      runningMinutes: performance?.runningMinutes || 0,
      runningTime: performance?.runningTime || "0h 00m",
      achievementPercent: performance?.achievementPercent || 0,
      status: session.status || "Unknown",
      isRunning: !safeDate(getSessionEnd(session)),
    };
  });
};

/* ============================================================
   MAIN LIVE ANALYSIS
============================================================ */

export const getLiveAnalysis = async ({
  locationId,
  plantId,
  shiftId,
  conveyorId,
  date,
  now = new Date(),
}) => {
  const scope = await resolveLiveScope({
    locationId,
    plantId,
    shiftId,
    conveyorId,
  });

  const [shift, shiftRuntime, sessions] =
    await Promise.all([
      Shift.findById(scope.shiftId).lean(),

      getLiveShiftRuntime(scope),

      getLiveSessions({
        ...scope,
        date,
      }),
    ]);
    
  if (!shift) {
    const error = new Error(
      `Shift not found: ${scope.shiftId}`
    );

    error.statusCode = 404;
    throw error;
  }

  const currentSession = getCurrentProductionSession(sessions);

  const currentSessionPerformance = calculateLiveSessionPerformance(
    currentSession,
    now
  );

  const currentBlock = buildCurrentBlock({
    shift,
    now,
  });

  const blockPerformance = buildBlockPerformance({
    shift,
    sessions,
    now,
  });

  const upcomingBlocks = getUpcomingBlocks({
    shift,
    now,
  });

  const timeline = buildSessionTimeline({
    sessions,
    now,
  });

  const completedSessions = sessions.filter(
    (session) => safeDate(getSessionEnd(session))
  );

  const totalProduction = sessions.reduce(
    (sum, session) => sum + getSessionQuantity(session),
    0
  );

  const totalDowntime = sessions.reduce(
    (sum, session) => sum + getSessionDowntime(session),
    0
  );

  const totalRunningMinutes = sessions.reduce((sum, session) => {
    const start = safeDate(getSessionStart(session));
    const end = safeDate(getSessionEnd(session)) || now;

    if (!start) return sum;


    return sum + calculateDowntimeAdjustedMinutes(
    start,
    end,
    getSessionDowntime(session)
    );
  }, 0);

  const totalTarget = sessions.reduce(
    (sum, session) => sum + num(session.target || session.demandPerShift),
    0
  );

  return {
    scope: {
      locationId: scope.locationId,
      locationName: scope.locationName,
      plantId: scope.plantId,
      plantName: scope.plantName,
      shiftId: scope.shiftId,
      shiftName: scope.shiftName,
      conveyorId: scope.conveyorId,
    },

    serverTime: now,

    shift: {
      runtimeId: shiftRuntime?._id || null,
      shiftStartTime:
        shiftRuntime?.actualStartTime ||
        shiftRuntime?.shiftStartTime ||
        shiftRuntime?.startTime ||
        null,
      shiftEndTime:
        shiftRuntime?.actualEndTime ||
        shiftRuntime?.shiftEndTime ||
        shiftRuntime?.endTime ||
        null,
      status: shiftRuntime?.status || "Not Started",
    },

    currentBlock,

    currentSession: currentSession
      ? {
          sessionId: currentSession._id,
          modelId: currentSession.modelId || null,
          modelName:
            currentSession.modelName ||
            currentSession.model?.modelName ||
            "Unknown Model",
          status: currentSession.status,
          performance: currentSessionPerformance,
        }
      : null,

    summary: {
      totalProduction: round(totalProduction),
      totalTarget: round(totalTarget),
      achievementPercent: round(
        calculateAchievement({
            productionQty: totalProduction,
            targetQty: totalTarget,
        })
        ),
      totalDowntimeMinutes: totalDowntime,
      totalRunningMinutes,
      averageProductionRate: round(
        calculateProductionRate({
            quantity: totalProduction,
            runningMinutes: totalRunningMinutes,
        })
        ),
      completedModels: completedSessions.length,
      activeModel: currentSession ? 1 : 0,
    },

    blocks: {
      current: currentBlock,
      upcoming: upcomingBlocks,
      all: blockPerformance,
    },

    timeline,

    lastUpdatedAt: now,
  };
};

/* ============================================================
   GET LIVE ANALYSIS FOR REQUEST
============================================================ */

export const getLiveAnalysisForRequest = async (req) => {
  const {
    locationId,
    plantId,
    shiftId,
    conveyorId,
    date,
  } = req.query;

  return getLiveAnalysis({
    locationId,
    plantId,
    shiftId,
    conveyorId,
    date,
    now: new Date(),
  });
};

/* ============================================================
   GET CURRENT MODEL
============================================================ */

export const getCurrentModelAnalysis = async ({
  plantId,
  shiftId,
  conveyorId,
  date,
}) => {
  const sessions = await getLiveSessions({
    plantId,
    shiftId,
    conveyorId,
    date,
  });

  const session = getCurrentProductionSession(sessions);

  if (!session) return null;

  return {
    sessionId: session._id,
    modelId: session.modelId || null,
    modelName: session.modelName || session.model?.modelName || "Unknown Model",
    status: session.status,
    performance: calculateLiveSessionPerformance(session),
  };
};

/* ============================================================
   GET CURRENT BLOCK PERFORMANCE
============================================================ */

export const getCurrentBlockAnalysis = async ({
  locationId,
  plantId,
  shiftId,
  conveyorId,
  date,
}) => {
  const scope = await resolveLiveScope({
    locationId,
    plantId,
    shiftId,
    conveyorId,
  });

  const [shift, shiftRuntime, sessions] = await Promise.all([
    Shift.findById(scope.shiftId).lean(),
    getLiveShiftRuntime(scope),
    getLiveSessions({
      ...scope,
      date,
    }),
  ]);

  if (!shift) {
    const error = new Error(
      `Shift not found: ${scope.shiftId}`
    );

    error.statusCode = 404;
    throw error;
  }


  return buildCurrentBlock({
    shift,
    now: new Date(),
  });
};