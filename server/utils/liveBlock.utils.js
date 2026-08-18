/**
 * ============================================================
 * LIVE BLOCK UTILS
 * ============================================================
 *
 * Purpose:
 * Dynamically generate Live Analysis time blocks directly
 * from Shift Master.
 *
 * SOURCE OF TRUTH:
 *
 * Shift Master:
 *   shiftStartTime
 *   shiftEndTime
 *   breaks[]
 *
 * NO hardcoded shift times.
 * NO hardcoded break times.
 * NO TimeBlockConfiguration dependency.
 *
 * Supports:
 *   - Normal shifts
 *   - Night / cross-midnight shifts
 *   - Multiple breaks
 *   - Breaks at arbitrary times
 *   - Dynamic production blocks
 *   - Current block detection
 *   - Upcoming block detection
 *   - Shift status detection
 * ============================================================
 */

/* ============================================================
   BASIC TIME HELPERS
============================================================ */

/**
 * Convert "HH:mm" into minutes from midnight.
 * Example: "07:30" -> 450 | "12:30" -> 750 | "19:30" -> 1170
 */
export const timeToMinutes = (time) => {
  if (!time || typeof time !== "string") throw new Error(`Invalid time value: ${time}`);

  const parts = time.split(":");
  if (parts.length !== 2) throw new Error(`Invalid time format: ${time}. Expected HH:mm`);

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time value: ${time}`);
  }

  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight back into HH:mm.
 * Example: 450 -> "07:30"
 */
export const minutesToTime = (totalMinutes) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/* ============================================================
   DATE HELPERS
============================================================ */

/**
 * Create a Date using a base shift date and minutes from midnight.
 * This function is intentionally independent of any hardcoded shift time.
 */
const createDateFromMinutes = (baseDate, minutes) => {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);

  const daysToAdd = Math.floor(minutes / 1440);
  const minutesOfDay = minutes % 1440;

  date.setDate(date.getDate() + daysToAdd);
  date.setHours(Math.floor(minutesOfDay / 60), minutesOfDay % 60, 0, 0);

  return date;
};

/* ============================================================
   SHIFT DATE RESOLUTION
============================================================ */

/**
 * Resolve the actual calendar start/end Date objects for a shift.
 *
 * Important: Shift Master stores only time strings:
 *   shiftStartTime = "19:30"
 *   shiftEndTime   = "07:30"
 *
 * Therefore this utility determines whether the shift crosses midnight.
 * Example: 07:30 -> 19:30 = same calendar day. 19:30 -> 07:30 = end belongs to next calendar day.
 */
export const resolveShiftDateTimes = ({ shift, baseDate = new Date() }) => {
  if (!shift) throw new Error("Shift is required");

  const startMinutes = timeToMinutes(shift.shiftStartTime);
  const endMinutes = timeToMinutes(shift.shiftEndTime);

  const shiftStartTime = createDateFromMinutes(baseDate, startMinutes);

  let normalizedEndMinutes = endMinutes;

  /**
   * If end <= start, the shift crosses midnight.
   * Example: start = 19:30 = 1170, end = 07:30 = 450 -> end = 450 + 1440
   */
  if (endMinutes <= startMinutes) normalizedEndMinutes += 1440;

  const shiftEndTime = createDateFromMinutes(baseDate, normalizedEndMinutes);

  return {
    shiftStartTime,
    shiftEndTime,
    startMinutes,
    endMinutes,
    normalizedEndMinutes,
    crossesMidnight: endMinutes <= startMinutes,
  };
};

/* ============================================================
   BREAK NORMALIZATION
============================================================ */

/**
 * Convert Shift Master breaks into actual Date ranges.
 *
 * Source:
 * shift.breaks = [{ breakName, startTime, endTime, durationMinutes }]
 *
 * Nothing is hardcoded.
 */
export const resolveShiftBreaks = ({ shift, shiftStartTime, shiftEndTime }) => {
  if (!shift) throw new Error("Shift is required");

  const breaks = Array.isArray(shift.breaks) ? shift.breaks : [];
  const shiftStartMs = shiftStartTime.getTime();
  const shiftEndMs = shiftEndTime.getTime();

  return breaks
    .map((breakItem, index) => {
      if (!breakItem?.startTime || !breakItem?.endTime) return null;

      const startMinutes = timeToMinutes(breakItem.startTime);
      const endMinutes = timeToMinutes(breakItem.endTime);

      /**
       * Breaks are also daily recurring templates.
       * If break end <= break start, it crosses midnight.
       */
      let normalizedEndMinutes = endMinutes;
      if (endMinutes <= startMinutes) normalizedEndMinutes += 1440;

      /**
       * Find the break's position relative to the shift.
       * We try the current day first, then next day.
       */
      const possibleStartOffsets = [startMinutes, startMinutes + 1440];
      let selectedStartMinutes = null;

      for (const candidate of possibleStartOffsets) {
        const candidateDate = createDateFromMinutes(shiftStartTime, candidate);
        const candidateMs = candidateDate.getTime();

        if (candidateMs >= shiftStartMs && candidateMs < shiftEndMs) {
          selectedStartMinutes = candidate;
          break;
        }
      }

      // If the break begins exactly at shift end, it is outside this shift.
      if (selectedStartMinutes === null) return null;

      const selectedEndMinutes = selectedStartMinutes + (normalizedEndMinutes - startMinutes);

      const breakStartTime = createDateFromMinutes(shiftStartTime, selectedStartMinutes);
      const breakEndTime = createDateFromMinutes(shiftStartTime, selectedEndMinutes);

      // Clamp the break to shift boundaries.
      const actualStartMs = Math.max(breakStartTime.getTime(), shiftStartMs);
      const actualEndMs = Math.min(breakEndTime.getTime(), shiftEndMs);

      if (actualEndMs <= actualStartMs) return null;

      const actualStart = new Date(actualStartMs);
      const actualEnd = new Date(actualEndMs);

      return {
        breakIndex: index,
        breakName: breakItem.breakName || `Break ${index + 1}`,
        type: "Break",
        startTime: actualStart,
        endTime: actualEnd,
        durationMinutes: Math.round((actualEndMs - actualStartMs) / 60000),
        isBreak: true,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

/* ============================================================
   PRODUCTION BLOCK GENERATOR
============================================================ */

/**
 * Generate production blocks dynamically.
 *
 * IMPORTANT: There is intentionally NO configured hourly duration here.
 * The algorithm creates blocks by moving forward from the previous boundary until:
 *   1. shift end
 *   2. scheduled break
 * Whichever comes first becomes the block end. Therefore a break can occur at ANY time.
 *
 * Example:
 *   Shift: 07:30 -> 19:30
 *   Break: 12:30 -> 13:30
 *   Result: 07:30 -> 08:30, 08:30 -> 09:30, ... 11:30 -> 12:30, BREAK, 13:30 -> 14:30, ...
 */
export const generateProductionBlocks = ({ shift, shiftStartTime, shiftEndTime, breaks = [] }) => {
  if (!shift) throw new Error("Shift is required");

  const blocks = [];
  let cursor = new Date(shiftStartTime);
  let blockNumber = 1;
  const shiftEndMs = shiftEndTime.getTime();

  while (cursor.getTime() < shiftEndMs) {
    // Find the first break that begins after or at cursor.
    const nextBreak = breaks.find(
      (breakItem) => breakItem.startTime.getTime() >= cursor.getTime() && breakItem.startTime.getTime() < shiftEndMs
    );

    // If cursor is currently inside a break, the production block generator should skip it.
    const activeBreak = breaks.find(
      (breakItem) =>
        cursor.getTime() >= breakItem.startTime.getTime() && cursor.getTime() < breakItem.endTime.getTime()
    );

    if (activeBreak) {
      cursor = new Date(activeBreak.endTime);
      continue;
    }

    /**
     * Production blocks are dynamically segmented.
     * Current implementation creates a maximum one-hour block from the cursor.
     *
     * IMPORTANT: The one-hour boundary is NOT a hardcoded shift time.
     * It is a block granularity used by Live Analysis.
     * Shift timing and breaks always come from Shift Master.
     */
    const oneHourLater = new Date(cursor.getTime() + 60 * 60000);
    let blockEnd = new Date(Math.min(oneHourLater.getTime(), shiftEndMs));

    // If a break starts before the normal block end, split the block at the break.
    if (nextBreak && nextBreak.startTime.getTime() < blockEnd.getTime()) {
      blockEnd = new Date(nextBreak.startTime);
    }

    // Safety protection.
    if (blockEnd.getTime() <= cursor.getTime()) {
      cursor = new Date(cursor.getTime() + 60000);
      continue;
    }

    const durationMinutes = Math.round((blockEnd.getTime() - cursor.getTime()) / 60000);

    blocks.push({
      blockNumber,
      blockName: `${minutesToTime(Math.round(cursor.getHours() * 60 + cursor.getMinutes()))} - ${minutesToTime(
        Math.round(blockEnd.getHours() * 60 + blockEnd.getMinutes())
      )}`,
      type: "Production",
      startTime: new Date(cursor),
      endTime: new Date(blockEnd),
      startOffsetMinutes: Math.round((cursor.getTime() - shiftStartTime.getTime()) / 60000),
      endOffsetMinutes: Math.round((blockEnd.getTime() - shiftStartTime.getTime()) / 60000),
      durationMinutes,
      active: true,
      isBreak: false,
    });

    blockNumber += 1;
    cursor = new Date(blockEnd);

    // If cursor reaches a break start, skip the break here. The break itself is added later to the timeline.
    const breakAtCursor = breaks.find((breakItem) => breakItem.startTime.getTime() === cursor.getTime());

    if (breakAtCursor) {
      cursor = new Date(breakAtCursor.endTime);
    }
  }

  return blocks;
};

/* ============================================================
   COMPLETE SHIFT TIMELINE
============================================================ */

/**
 * Build the complete timeline: Production, Break, Production, Break ...
 * This is the main function Live Analysis should consume.
 */
export const buildShiftTimeline = ({ shift, baseDate = new Date() }) => {
  if (!shift) throw new Error("Shift is required");

  const { shiftStartTime, shiftEndTime, crossesMidnight } = resolveShiftDateTimes({ shift, baseDate });

  const breaks = resolveShiftBreaks({ shift, shiftStartTime, shiftEndTime });

  const productionBlocks = generateProductionBlocks({ shift, shiftStartTime, shiftEndTime, breaks });

  // Combine production blocks + breaks.
  const timeline = [
    ...productionBlocks,
    ...breaks.map((breakItem) => ({
      blockNumber: null,
      blockName: breakItem.breakName,
      type: "Break",
      startTime: new Date(breakItem.startTime),
      endTime: new Date(breakItem.endTime),
      startOffsetMinutes: Math.round((breakItem.startTime.getTime() - shiftStartTime.getTime()) / 60000),
      endOffsetMinutes: Math.round((breakItem.endTime.getTime() - shiftStartTime.getTime()) / 60000),
      durationMinutes: breakItem.durationMinutes,
      active: true,
      isBreak: true,
    })),
  ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return {
    shiftStartTime,
    shiftEndTime,
    crossesMidnight,
    breaks,
    productionBlocks,
    timeline,
    totalShiftMinutes: Math.round((shiftEndTime.getTime() - shiftStartTime.getTime()) / 60000),
    totalBreakMinutes: breaks.reduce((total, breakItem) => total + breakItem.durationMinutes, 0),
    actualWorkingMinutes:
      Math.round((shiftEndTime.getTime() - shiftStartTime.getTime()) / 60000) -
      breaks.reduce((total, breakItem) => total + breakItem.durationMinutes, 0),
  };
};

/* ============================================================
   CURRENT LIVE BLOCK
============================================================ */

/**
 * Find the current item based on server time.
 * Returns: Production block OR Break OR null
 */
export const getCurrentLiveBlock = ({ timeline, currentTime = new Date() }) => {
  if (!Array.isArray(timeline)) return null;

  const nowMs = new Date(currentTime).getTime();

  return timeline.find((item) => nowMs >= item.startTime.getTime() && nowMs < item.endTime.getTime()) || null;
};

/* ============================================================
   UPCOMING BLOCKS
============================================================ */

export const getUpcomingBlocks = ({ timeline, currentTime = new Date() }) => {
  if (!Array.isArray(timeline)) return [];

  const nowMs = new Date(currentTime).getTime();

  return timeline.filter((item) => item.startTime.getTime() > nowMs);
};

/* ============================================================
   SHIFT STATUS
============================================================ */

/**
 * Possible states: Not Started | Running | Break | Completed
 */
export const getShiftStatus = ({ shiftStartTime, shiftEndTime, timeline = [], currentTime = new Date() }) => {
  const nowMs = new Date(currentTime).getTime();
  const startMs = shiftStartTime.getTime();
  const endMs = shiftEndTime.getTime();

  if (nowMs < startMs) return "Not Started";
  if (nowMs >= endMs) return "Completed";

  const currentBlock = getCurrentLiveBlock({ timeline, currentTime });

  if (currentBlock?.isBreak) return "Break";

  return "Running";
};

/* ============================================================
   ELAPSED / REMAINING
============================================================ */

export const calculateShiftElapsed = ({ shiftStartTime, shiftEndTime, currentTime = new Date() }) => {
  const nowMs = new Date(currentTime).getTime();
  const startMs = shiftStartTime.getTime();
  const endMs = shiftEndTime.getTime();

  if (nowMs <= startMs) return 0;
  if (nowMs >= endMs) return Math.round((endMs - startMs) / 60000);

  return Math.round((nowMs - startMs) / 60000);
};

export const calculateShiftRemaining = ({ shiftStartTime, shiftEndTime, currentTime = new Date() }) => {
  const nowMs = new Date(currentTime).getTime();
  const endMs = shiftEndTime.getTime();

  if (nowMs >= endMs) return 0;
  if (nowMs <= shiftStartTime.getTime()) return Math.round((endMs - shiftStartTime.getTime()) / 60000);

  return Math.round((endMs - nowMs) / 60000);
};