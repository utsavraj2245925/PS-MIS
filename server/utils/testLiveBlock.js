console.log(">>> TEST LIVE BLOCK FILE STARTED <<<");

import mongoose from "mongoose";
import Shift from "../models/shift.model.js";
import {
  buildShiftTimeline,
  getCurrentLiveBlock,
  getUpcomingBlocks,
  getShiftStatus,
} from "./liveBlock.utils.js";

const run = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/paintshopmis"
    );

    console.log("MongoDB connected");

    const shift = await Shift.findOne({
      shiftName: "Shift 1",
      status: "Active",
    }).lean();

    if (!shift) {
      throw new Error("Active Shift 1 not found");
    }

    console.log("\nSHIFT MASTER:");
    console.log({
      shiftName: shift.shiftName,
      start: shift.shiftStartTime,
      end: shift.shiftEndTime,
      breaks: shift.breaks,
    });

    const timeline = buildShiftTimeline({
      shift,
      baseDate: new Date(),
    });
    console.log("\nSHIFT STATUS TEST:");

    console.log(
      getShiftStatus({
        shiftStartTime: timeline.shiftStartTime,
        shiftEndTime: timeline.shiftEndTime,
        timeline: timeline.timeline,
        currentTime: new Date(),
      })
    );

    console.log("\nSHIFT TIMING:");
    console.log({
      shiftStartTime: timeline.shiftStartTime,
      shiftEndTime: timeline.shiftEndTime,
      crossesMidnight: timeline.crossesMidnight,
      totalShiftMinutes: timeline.totalShiftMinutes,
      totalBreakMinutes: timeline.totalBreakMinutes,
      actualWorkingMinutes: timeline.actualWorkingMinutes,
    });

    console.log("\nGENERATED BLOCKS:");

    console.table(
      timeline.timeline.map((block) => ({
        number: block.blockNumber,
        name: block.blockName,
        type: block.type,
        start: block.startTime,
        end: block.endTime,
        duration: block.durationMinutes,
        break: block.isBreak,
      }))
    );
    
console.log("\nCURRENT BLOCK TEST:");

const currentTime = new Date();

const currentBlock = getCurrentLiveBlock({
  timeline: timeline.timeline,
  currentTime,
});

console.log({
  currentTime,
  currentBlock: currentBlock
    ? {
        blockNumber: currentBlock.blockNumber,
        blockName: currentBlock.blockName,
        type: currentBlock.type,
        startTime: currentBlock.startTime,
        endTime: currentBlock.endTime,
        isBreak: currentBlock.isBreak,
      }
    : null,
});

console.log("\nUPCOMING BLOCKS TEST:");

const upcomingBlocks = getUpcomingBlocks({
  timeline: timeline.timeline,
  currentTime,
});

console.table(
  upcomingBlocks.map((block) => ({
    number: block.blockNumber,
    name: block.blockName,
    type: block.type,
    start: block.startTime,
    end: block.endTime,
    duration: block.durationMinutes,
    break: block.isBreak,
  }))
);

    console.log("\nBREAK TEST:");

const breakTime = new Date(timeline.shiftStartTime);
breakTime.setHours(14, 20, 0, 0);

const breakBlock = timeline.timeline.find(
  (block) =>
    breakTime >= block.startTime &&
    breakTime < block.endTime
);

console.log({
  testTime: breakTime,
  block: breakBlock
    ? {
        blockNumber: breakBlock.blockNumber,
        blockName: breakBlock.blockName,
        type: breakBlock.type,
        isBreak: breakBlock.isBreak,
      }
    : null,
});

    await mongoose.disconnect();

    console.log("\nTest completed successfully");
  } catch (error) {
    console.error("\nTEST FAILED:");
    console.error(error);

    process.exitCode = 1;
  }
};

run();