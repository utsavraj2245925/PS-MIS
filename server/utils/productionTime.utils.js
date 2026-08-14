// server/utils/productionTime.utils.js

/* =========================================================
   BASIC TIME HELPERS
========================================================= */

export const MINUTES_PER_DAY = 1440;

export const timeToMinutes = (time) => {
    if (!time || typeof time !== "string" || !time.includes(":")) return null;
    const [hours, minutes] = time.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
    const value = ((Number(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const minutesToDuration = (minutes) => {
    const total = Math.max(Math.round(Number(minutes) || 0), 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

export const normalizeTimeToShift = (shiftStartMinutes, time) => {
    const value = timeToMinutes(time);
    if (value === null || shiftStartMinutes === null) return null;
    return value < shiftStartMinutes ? value + MINUTES_PER_DAY : value;
};


/* =========================================================
   DATE HELPERS
========================================================= */

export const isValidDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    return !Number.isNaN(date.getTime());
};

export const dateDiffMinutes = (startTime, endTime) => {
    if (!isValidDate(startTime) || !isValidDate(endTime)) return 0;
    return Math.max(Math.round((new Date(endTime) - new Date(startTime)) / 60000), 0);
};


/* =========================================================
   SHIFT WINDOW
========================================================= */

export const getShiftWindow = ({ shiftStartTime, shiftEndTime, referenceDate = new Date() }) => {
    const startMin = timeToMinutes(shiftStartTime);
    const endMin = normalizeTimeToShift(startMin, shiftEndTime);

    if (startMin === null || endMin === null) {
        throw new Error("Invalid shift start/end time. Expected HH:mm.");
    }

    if (endMin <= startMin) {
        throw new Error("Shift end time must be after shift start time.");
    }

    const baseDate = new Date(referenceDate);
    baseDate.setHours(0, 0, 0, 0);

    const startDate = new Date(baseDate);
    startDate.setMinutes(startMin);

    const endDate = new Date(baseDate);
    endDate.setMinutes(endMin);

    return {
        startMinutes: startMin,
        endMinutes: endMin,
        durationMinutes: endMin - startMin,
        startDate,
        endDate,
    };
};


/* =========================================================
   BREAK NORMALIZATION
========================================================= */

export const normalizeBreaks = ({ shiftStartTime, breaks = [] }) => {
    const shiftStartMin = timeToMinutes(shiftStartTime);
    if (shiftStartMin === null) return [];

    return breaks
        .map((item) => {
            const start = normalizeTimeToShift(shiftStartMin, item.startTime);
            const end = normalizeTimeToShift(shiftStartMin, item.endTime);

            if (start === null || end === null || end <= start) return null;

            return {
                breakName: item.breakName || "Break",
                startMinutes: start,
                endMinutes: end,
                durationMinutes: end - start,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.startMinutes - b.startMinutes);
};


/* =========================================================
   OVERLAP CALCULATION
========================================================= */

export const getOverlapMinutes = (startA, endA, startB, endB) => {
    const start = Math.max(Number(startA), Number(startB));
    const end = Math.min(Number(endA), Number(endB));
    return Math.max(end - start, 0);
};

export const getTotalOverlapMinutes = (start, end, ranges = []) => {
    return ranges.reduce((total, range) => {
        return total + getOverlapMinutes(start, end, range.startMinutes, range.endMinutes);
    }, 0);
};


/* =========================================================
   BREAK-ADJUSTED RUNNING TIME
========================================================= */

export const calculateBreakAdjustedMinutes = ({ startTime, endTime, breaks = [] }) => {
    const totalMinutes = dateDiffMinutes(startTime, endTime);

    if (!totalMinutes || !breaks.length) return totalMinutes;

    const startDate = new Date(startTime);
    const baseDate = new Date(startDate);
    baseDate.setHours(0, 0, 0, 0);

    const startAbsolute = startDate.getHours() * 60 + startDate.getMinutes();
    const endDate = new Date(endTime);
    let endAbsolute = endDate.getHours() * 60 + endDate.getMinutes();

    if (endDate.getDate() > startDate.getDate()) endAbsolute += MINUTES_PER_DAY;

    const normalizedBreaks = breaks.map((item) => {
        const breakStart = item.startMinutes;
        const breakEnd = item.endMinutes;
        return { startMinutes: breakStart, endMinutes: breakEnd };
    });

    const breakMinutes = getTotalOverlapMinutes(startAbsolute, endAbsolute, normalizedBreaks);

    return Math.max(totalMinutes - breakMinutes, 0);
};


/* =========================================================
   DOWNTIME NORMALIZATION
========================================================= */

export const normalizeDowntimes = (downtimes = []) => {
    return downtimes
        .filter((item) => item?.startTime && item?.endTime)
        .map((item) => ({
            type: item.type || "Unplanned",
            downtimeTypeId: item.downtimeTypeId || null,
            startTime: new Date(item.startTime),
            endTime: new Date(item.endTime),
            durationMinutes: dateDiffMinutes(item.startTime, item.endTime),
            remark: item.remark || "",
        }))
        .filter((item) => item.durationMinutes > 0)
        .sort((a, b) => a.startTime - b.startTime);
};


/* =========================================================
   DOWNTIME OVERLAP
========================================================= */

export const calculateDowntimeOverlap = ({ startTime, endTime, downtimes = [] }) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return downtimes.reduce((total, downtime) => {
        const downtimeStart = new Date(downtime.startTime);
        const downtimeEnd = new Date(downtime.endTime);

        const overlapStart = Math.max(start.getTime(), downtimeStart.getTime());
        const overlapEnd = Math.min(end.getTime(), downtimeEnd.getTime());

        if (overlapEnd <= overlapStart) return total;

        return total + Math.round((overlapEnd - overlapStart) / 60000);
    }, 0);
};


/* =========================================================
   DOWNTIME BREAKDOWN
========================================================= */

export const calculateDowntimeBreakdown = ({ startTime, endTime, downtimes = [] }) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    let planned = 0;
    let unplanned = 0;

    downtimes.forEach((item) => {
        const itemStart = new Date(item.startTime);
        const itemEnd = new Date(item.endTime);

        const overlapStart = Math.max(start.getTime(), itemStart.getTime());
        const overlapEnd = Math.min(end.getTime(), itemEnd.getTime());

        if (overlapEnd <= overlapStart) return;

        const minutes = Math.round((overlapEnd - overlapStart) / 60000);

        if (item.type === "Planned") planned += minutes;
        if (item.type === "Unplanned") unplanned += minutes;
    });

    return {
        plannedDowntimeMinutes: planned,
        unplannedDowntimeMinutes: unplanned,
        totalDowntimeMinutes: planned + unplanned,
    };
};


/* =========================================================
   DOWNTIME-ADJUSTED RUNNING TIME
========================================================= */

export const calculateRunningTime = ({ startTime, endTime, breaks = [], downtimes = [] }) => {
    const grossMinutes = dateDiffMinutes(startTime, endTime);

    const breakMinutes = calculateBreakAdjustedMinutes({
        startTime,
        endTime,
        breaks,
    });

    const downtime = calculateDowntimeBreakdown({
        startTime,
        endTime,
        downtimes,
    });

    const downtimeAdjustedRunningMinutes = Math.max(
        breakMinutes - downtime.totalDowntimeMinutes,
        0
    );

    return {
        grossMinutes,
        breakMinutes: Math.max(grossMinutes - breakMinutes, 0),
        downtimeMinutes: downtime.totalDowntimeMinutes,
        plannedDowntimeMinutes: downtime.plannedDowntimeMinutes,
        unplannedDowntimeMinutes: downtime.unplannedDowntimeMinutes,
        runningMinutes: downtimeAdjustedRunningMinutes,
    };
};


/* =========================================================
   PRODUCTION RATE
========================================================= */

export const calculateProductionRate = ({ quantity = 0, runningMinutes = 0 }) => {
    const qty = Number(quantity) || 0;
    const minutes = Number(runningMinutes) || 0;

    if (minutes <= 0) return 0;

    return Number((qty / (minutes / 60)).toFixed(2));
};


/* =========================================================
   AVERAGE PRODUCTION RATE
========================================================= */

export const calculateAverageProductionRate = ({ quantity = 0, startTime, endTime, breaks = [], downtimes = [] }) => {
    const runtime = calculateRunningTime({
        startTime,
        endTime,
        breaks,
        downtimes,
    });

    return {
        ...runtime,
        averageProductionRate: calculateProductionRate({
            quantity,
            runningMinutes: runtime.runningMinutes,
        }),
    };
};


/* =========================================================
   ACHIEVEMENT
========================================================= */

export const calculateAchievement = ({ productionQty = 0, targetQty = 0 }) => {
    const production = Number(productionQty) || 0;
    const target = Number(targetQty) || 0;

    if (target <= 0) return 0;

    return Number(((production / target) * 100).toFixed(2));
};


/* =========================================================
   TIME-BLOCK CONFIGURATION
========================================================= */

export const normalizeTimeBlocks = ({ shiftStartTime, blocks = [] }) => {
    const shiftStartMin = timeToMinutes(shiftStartTime);
    if (shiftStartMin === null) return [];

    return blocks
        .map((block, index) => {
            const start = normalizeTimeToShift(shiftStartMin, block.startTime);
            const end = normalizeTimeToShift(shiftStartMin, block.endTime);

            if (start === null || end === null || end <= start) return null;

            return {
                blockId: block._id || block.blockId || `block-${index + 1}`,
                blockName: block.blockName || block.name || `Block ${index + 1}`,
                sequence: block.sequence ?? index + 1,
                startMinutes: start,
                endMinutes: end,
                durationMinutes: end - start,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.startMinutes - b.startMinutes);
};


/* =========================================================
   FIND TIME BLOCK
========================================================= */

export const findTimeBlock = ({ dateTime, shiftStartTime, blocks = [] }) => {
    if (!dateTime) return null;

    const date = new Date(dateTime);
    if (!isValidDate(date)) return null;

    const shiftStartMin = timeToMinutes(shiftStartTime);
    if (shiftStartMin === null) return null;

    let currentMinutes = date.getHours() * 60 + date.getMinutes();

    if (currentMinutes < shiftStartMin) currentMinutes += MINUTES_PER_DAY;

    const normalizedBlocks = normalizeTimeBlocks({
        shiftStartTime,
        blocks,
    });

    return normalizedBlocks.find(
        (block) => currentMinutes >= block.startMinutes && currentMinutes < block.endMinutes
    ) || null;
};


/* =========================================================
   TIME-BLOCK OVERLAP
========================================================= */

export const calculateTimeBlockOverlap = ({ startTime, endTime, shiftStartTime, blocks = [] }) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!isValidDate(start) || !isValidDate(end) || end <= start) return [];

    const normalizedBlocks = normalizeTimeBlocks({
        shiftStartTime,
        blocks,
    });

    const result = [];

    normalizedBlocks.forEach((block) => {
        const blockStart = new Date(start);
        const blockEnd = new Date(start);

        const shiftStartMin = timeToMinutes(shiftStartTime);
        let blockStartMin = block.startMinutes;
        let blockEndMin = block.endMinutes;

        const dayStart = new Date(start);
        dayStart.setHours(0, 0, 0, 0);

        const dayStartAbsolute = shiftStartMin;

        if (blockStartMin >= MINUTES_PER_DAY) {
            blockStartMin -= MINUTES_PER_DAY;
        }

        if (blockEndMin >= MINUTES_PER_DAY) {
            blockEndMin -= MINUTES_PER_DAY;
        }

        const originalBlock = block;

        const shiftDate = new Date(start);
        shiftDate.setHours(0, 0, 0, 0);

        let blockStartDate = new Date(shiftDate);
        let blockEndDate = new Date(shiftDate);

        const normalizedStart = originalBlock.startMinutes;
        const normalizedEnd = originalBlock.endMinutes;

        blockStartDate.setMinutes(normalizedStart);
        blockEndDate.setMinutes(normalizedEnd);

        if (normalizedEnd > MINUTES_PER_DAY) {
            blockEndDate.setDate(blockEndDate.getDate() + 1);
            blockEndDate.setMinutes(normalizedEnd - MINUTES_PER_DAY);
        }

        if (normalizedStart >= MINUTES_PER_DAY) {
            blockStartDate.setDate(blockStartDate.getDate() + 1);
            blockStartDate.setMinutes(normalizedStart - MINUTES_PER_DAY);
        }

        const overlapStart = Math.max(start.getTime(), blockStartDate.getTime());
        const overlapEnd = Math.min(end.getTime(), blockEndDate.getTime());

        if (overlapEnd <= overlapStart) return;

        const overlapMinutes = Math.round((overlapEnd - overlapStart) / 60000);

        result.push({
            blockId: block.blockId,
            blockName: block.blockName,
            sequence: block.sequence,
            startTime: blockStartDate,
            endTime: blockEndDate,
            overlapMinutes,
            percentage: Number(((overlapMinutes / block.durationMinutes) * 100).toFixed(2)),
        });
    });

    return result;
};


/* =========================================================
   ALLOCATE PRODUCTION INTO TIME BLOCKS
========================================================= */

export const allocateQuantityAcrossTimeBlocks = ({ quantity = 0, startTime, endTime, shiftStartTime, blocks = [] }) => {
    const qty = Number(quantity) || 0;

    if (qty <= 0) return [];

    const overlaps = calculateTimeBlockOverlap({
        startTime,
        endTime,
        shiftStartTime,
        blocks,
    });

    const totalOverlap = overlaps.reduce((sum, item) => sum + item.overlapMinutes, 0);

    if (totalOverlap <= 0) return [];

    let allocated = 0;

    return overlaps.map((item, index) => {
        const isLast = index === overlaps.length - 1;
        const blockQty = isLast
            ? Number((qty - allocated).toFixed(2))
            : Number(((qty * item.overlapMinutes) / totalOverlap).toFixed(2));

        allocated += blockQty;

        return {
            ...item,
            productionQty: blockQty,
        };
    });
};


/* =========================================================
   MODEL TIMELINE
========================================================= */

export const buildModelTimeline = ({ productionSession, shiftStartTime, blocks = [], downtimes = [], breaks = [] }) => {
    if (!productionSession?.startTime || !productionSession?.endTime) return null;

    const startTime = new Date(productionSession.startTime);
    const endTime = new Date(productionSession.endTime);

    const runtime = calculateRunningTime({
        startTime,
        endTime,
        breaks,
        downtimes,
    });

    const blockAllocation = allocateQuantityAcrossTimeBlocks({
        quantity: productionSession.totalQuantity || productionSession.productionQty || 0,
        startTime,
        endTime,
        shiftStartTime,
        blocks,
    });

    return {
        sessionId: productionSession._id,
        modelId: productionSession.modelId,
        modelName: productionSession.modelName,
        startTime,
        endTime,
        durationMinutes: dateDiffMinutes(startTime, endTime),
        grossMinutes: runtime.grossMinutes,
        runningMinutes: runtime.runningMinutes,
        plannedDowntimeMinutes: runtime.plannedDowntimeMinutes,
        unplannedDowntimeMinutes: runtime.unplannedDowntimeMinutes,
        totalDowntimeMinutes: runtime.downtimeMinutes,
        averageProductionRate: calculateProductionRate({
            quantity: productionSession.totalQuantity || 0,
            runningMinutes: runtime.runningMinutes,
        }),
        achievementPercent: calculateAchievement({
            productionQty: productionSession.totalQuantity || 0,
            targetQty: productionSession.demandPerShift || 0,
        }),
        timeBlocks: blockAllocation,
    };
};


/* =========================================================
   COMPLETE MODEL SESSION CALCULATION
========================================================= */

export const calculateProductionSession = ({ startTime, endTime, totalQuantity = 0, targetQty = 0, breaks = [], downtimes = [] }) => {
    const runtime = calculateAverageProductionRate({
        quantity: totalQuantity,
        startTime,
        endTime,
        breaks,
        downtimes,
    });

    return {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes: dateDiffMinutes(startTime, endTime),
        totalQuantity: Number(totalQuantity) || 0,
        targetQty: Number(targetQty) || 0,
        averageProductionRate: runtime.averageProductionRate,
        grossMinutes: runtime.grossMinutes,
        breakMinutes: runtime.breakMinutes,
        downtimeMinutes: runtime.downtimeMinutes,
        plannedDowntimeMinutes: runtime.plannedDowntimeMinutes,
        unplannedDowntimeMinutes: runtime.unplannedDowntimeMinutes,
        runningMinutes: runtime.runningMinutes,
        achievementPercent: calculateAchievement({
            productionQty: totalQuantity,
            targetQty,
        }),
    };
};


/* =========================================================
   LIVE MODEL SESSION
========================================================= */

export const calculateLiveProductionSession = ({ startTime, currentTime = new Date(), totalQuantity = 0, targetQty = 0, breaks = [], downtimes = [] }) => {
    return calculateProductionSession({
        startTime,
        endTime: currentTime,
        totalQuantity,
        targetQty,
        breaks,
        downtimes,
    });
};


/* =========================================================
   MODEL TIMELINE SEGMENTS
========================================================= */

export const buildTimelineSegments = ({ startTime, endTime, downtimes = [], shiftStartTime, blocks = [] }) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!isValidDate(start) || !isValidDate(end) || end <= start) return [];

    const segments = [];

    const blockOverlaps = calculateTimeBlockOverlap({
        startTime: start,
        endTime: end,
        shiftStartTime,
        blocks,
    });

    blockOverlaps.forEach((block) => {
        segments.push({
            type: "Production",
            blockId: block.blockId,
            blockName: block.blockName,
            startTime: block.startTime,
            endTime: block.endTime,
            durationMinutes: block.overlapMinutes,
        });
    });

    downtimes.forEach((downtime) => {
        const downtimeStart = new Date(downtime.startTime);
        const downtimeEnd = new Date(downtime.endTime);

        const overlapStart = new Date(Math.max(start.getTime(), downtimeStart.getTime()));
        const overlapEnd = new Date(Math.min(end.getTime(), downtimeEnd.getTime()));

        if (overlapEnd <= overlapStart) return;

        segments.push({
            type: downtime.type || "Unplanned",
            downtimeTypeId: downtime.downtimeTypeId || null,
            startTime: overlapStart,
            endTime: overlapEnd,
            durationMinutes: dateDiffMinutes(overlapStart, overlapEnd),
            remark: downtime.remark || "",
        });
    });

    return segments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};


/* =========================================================
   SESSION SUMMARY
========================================================= */

export const buildSessionSummary = ({ startTime, endTime, totalQuantity = 0, targetQty = 0, breaks = [], downtimes = [] }) => {
    const calculation = calculateProductionSession({
        startTime,
        endTime,
        totalQuantity,
        targetQty,
        breaks,
        downtimes,
    });

    return {
        durationMinutes: calculation.durationMinutes,
        duration: minutesToDuration(calculation.durationMinutes),
        runningMinutes: calculation.runningMinutes,
        runningTime: minutesToDuration(calculation.runningMinutes),
        downtimeMinutes: calculation.downtimeMinutes,
        downtime: minutesToDuration(calculation.downtimeMinutes),
        averageProductionRate: calculation.averageProductionRate,
        achievementPercent: calculation.achievementPercent,
    };
};

/* =========================================================
   EXTRA LIVE ANALYSIS HELPERS
========================================================= */

export const calculateDurationMinutes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    return Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 0);
};

export const calculateDowntimeAdjustedMinutes = (startTime, endTime, downtimeMinutes = 0) => {
    const durationMinutes = calculateDurationMinutes(startTime, endTime);
    return Math.max(durationMinutes - Number(downtimeMinutes || 0), 0);
};

export const calculateDowntimeAdjustedRunningMinutes = (startTime, endTime, downtimes = []) => {
    const durationMinutes = calculateDurationMinutes(startTime, endTime);

    if (!durationMinutes || !Array.isArray(downtimes) || !downtimes.length) {
        return durationMinutes;
    }

    const downtimeMinutes = calculateDowntimeOverlap({
        startTime,
        endTime,
        downtimes,
    });

    return Math.max(durationMinutes - downtimeMinutes, 0);
};
/* =========================================================
   GET CURRENT TIME BLOCK
========================================================= */

export const getCurrentTimeBlock = (blocks = [], shiftStartTime, currentTime = new Date()) => {
    if (!Array.isArray(blocks) || !blocks.length || !shiftStartTime) return null;

    const shiftStart = new Date(shiftStartTime);
    if (!isValidDate(shiftStart)) return null;

    const now = new Date(currentTime);
    if (!isValidDate(now)) return null;

    const shiftStartMinutes = shiftStart.getHours() * 60 + shiftStart.getMinutes();

    let currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes < shiftStartMinutes) currentMinutes += MINUTES_PER_DAY;

    const activeBlock = blocks
        .filter((block) => block?.active !== false)
        .map((block, index) => {
            const startOffset = Number(block.startOffsetMinutes);
            const endOffset = Number(block.endOffsetMinutes);

            if (!Number.isFinite(startOffset) || !Number.isFinite(endOffset)) return null;
            if (endOffset <= startOffset) return null;

            const startTime = new Date(shiftStart);
            startTime.setMinutes(startTime.getMinutes() + startOffset);

            const endTime = new Date(shiftStart);
            endTime.setMinutes(endTime.getMinutes() + endOffset);

            return {
                ...block,
                blockId: block._id || block.blockId || `block-${index + 1}`,
                blockNumber: block.blockNumber || index + 1,
                blockName: block.blockName || `Block ${index + 1}`,
                startTime,
                endTime,
                durationMinutes: endOffset - startOffset,
                startOffsetMinutes: startOffset,
                endOffsetMinutes: endOffset,
            };
        })
        .filter(Boolean)
        .find((block) => now >= block.startTime && now < block.endTime);

    return activeBlock || null;
};

/* =========================================================
   SESSION TIMING
========================================================= */

export const calculateSessionTiming = ({
  startTime,
  endTime = new Date(),
  breaks = [],
  downtimes = [],
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return {
      durationMinutes: 0,
      grossMinutes: 0,
      breakMinutes: 0,
      downtimeMinutes: 0,
      plannedDowntimeMinutes: 0,
      unplannedDowntimeMinutes: 0,
      runningMinutes: 0,
    };
  }

  const grossMinutes = calculateDurationMinutes(start, end);

  const breakAdjusted = calculateBreakAdjustedMinutes({
    startTime: start,
    endTime: end,
    breaks,
  });

  const breakMinutes = Math.max(grossMinutes - breakAdjusted, 0);

  const downtime = calculateDowntimeBreakdown({
    startTime: start,
    endTime: end,
    downtimes,
  });

  const runningMinutes = Math.max(
    grossMinutes -
      breakMinutes -
      downtime.totalDowntimeMinutes,
    0
  );

  return {
    durationMinutes: grossMinutes,
    grossMinutes,
    breakMinutes,
    downtimeMinutes: downtime.totalDowntimeMinutes,
    plannedDowntimeMinutes: downtime.plannedDowntimeMinutes,
    unplannedDowntimeMinutes: downtime.unplannedDowntimeMinutes,
    runningMinutes,
  };
};




/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  timeToMinutes,
  minutesToTime,
  minutesToDuration,
  normalizeTimeToShift,
  isValidDate,
  dateDiffMinutes,
  getShiftWindow,
  normalizeBreaks,
  getOverlapMinutes,
  getTotalOverlapMinutes,
  calculateBreakAdjustedMinutes,
  normalizeDowntimes,
  calculateDowntimeOverlap,
  calculateDowntimeBreakdown,
  calculateRunningTime,
  calculateProductionRate,
  calculateAverageProductionRate,
  calculateAchievement,
  normalizeTimeBlocks,
  findTimeBlock,
  calculateTimeBlockOverlap,
  allocateQuantityAcrossTimeBlocks,
  buildModelTimeline,
  calculateProductionSession,
  calculateLiveProductionSession,
  buildTimelineSegments,
  buildSessionSummary,
  calculateSessionTiming,
};