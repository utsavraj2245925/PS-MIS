import mongoose from "mongoose";

import Shift from "../models/shift.model.js";

import {
  buildShiftTimeline,
  getCurrentLiveBlock,
  getUpcomingBlocks,
  getShiftStatus,
} from "./liveBlock.utils.js";


/* ============================================================
   DATABASE
============================================================ */

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/paintshopmis";


/* ============================================================
   TEST
============================================================ */

const runTest = async () => {
  try {
    console.log("\n======================================");
    console.log("   LIVE BLOCK ENGINE TEST");
    console.log("======================================\n");


    /* --------------------------------------------------------
       CONNECT DATABASE
    -------------------------------------------------------- */

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected.\n");


    /* --------------------------------------------------------
       LOAD REAL SHIFT FROM SHIFT MASTER
    -------------------------------------------------------- */

    const shift = await Shift.findOne({
      status: "Active",
    }).sort({
      createdAt: 1,
    });


    if (!shift) {
      throw new Error(
        "No Active Shift found in Shift Master."
      );
    }


    console.log("SHIFT MASTER DATA");
    console.log("--------------------------------------");

    console.log("Shift Name:", shift.shiftName);
    console.log("Shift Type:", shift.shiftType);
    console.log("Start Time:", shift.shiftStartTime);
    console.log("End Time:", shift.shiftEndTime);

    console.log("\nBreaks:");

    if (!shift.breaks?.length) {
      console.log("No breaks configured.");
    } else {
      shift.breaks.forEach((breakItem, index) => {
        console.log(
          `${index + 1}.`,
          breakItem.breakName,
          "|",
          breakItem.startTime,
          "→",
          breakItem.endTime
        );
      });
    }


    /* --------------------------------------------------------
       BUILD DYNAMIC TIMELINE
    -------------------------------------------------------- */

    const result = buildShiftTimeline({
      shift,
      baseDate: new Date(),
    });


    /* --------------------------------------------------------
       SHIFT INFORMATION
    -------------------------------------------------------- */

    console.log("\n======================================");
    console.log("SHIFT TIMELINE");
    console.log("======================================\n");

    console.log(
      "Resolved Shift Start:",
      result.shiftStartTime
    );

    console.log(
      "Resolved Shift End:",
      result.shiftEndTime
    );

    console.log(
      "Crosses Midnight:",
      result.crossesMidnight
    );

    console.log(
      "Total Shift Minutes:",
      result.totalShiftMinutes
    );

    console.log(
      "Total Break Minutes:",
      result.totalBreakMinutes
    );

    console.log(
      "Actual Working Minutes:",
      result.actualWorkingMinutes
    );


    /* --------------------------------------------------------
       PRODUCTION BLOCKS
    -------------------------------------------------------- */

    console.log("\n======================================");
    console.log("PRODUCTION BLOCKS");
    console.log("======================================\n");

    if (!result.productionBlocks.length) {
      console.log("No production blocks generated.");
    }

    result.productionBlocks.forEach(
      (block) => {

        console.log(
          `Block ${block.blockNumber}`,
          "|",
          block.blockName,
          "|",
          block.durationMinutes,
          "min",
          "|",
          block.startTime,
          "→",
          block.endTime
        );

      }
    );


    /* --------------------------------------------------------
       BREAKS
    -------------------------------------------------------- */

    console.log("\n======================================");
    console.log("BREAKS");
    console.log("======================================\n");

    if (!result.breaks.length) {
      console.log("No breaks found.");
    }

    result.breaks.forEach(
      (breakItem) => {

        console.log(
          breakItem.breakName,
          "|",
          breakItem.durationMinutes,
          "min",
          "|",
          breakItem.startTime,
          "→",
          breakItem.endTime
        );

      }
    );


    /* --------------------------------------------------------
       COMPLETE TIMELINE
    -------------------------------------------------------- */

    console.log("\n======================================");
    console.log("COMPLETE TIMELINE");
    console.log("======================================\n");

    result.timeline.forEach(
      (item) => {

        console.log(
          item.type,
          "|",
          item.blockName,
          "|",
          item.durationMinutes,
          "min",
          "|",
          item.startTime,
          "→",
          item.endTime
        );

      }
    );


    /* --------------------------------------------------------
       CURRENT BLOCK
    -------------------------------------------------------- */

    const currentBlock =
      getCurrentLiveBlock({
        timeline: result.timeline,
        currentTime: new Date(),
      });


    console.log("\n======================================");
    console.log("CURRENT LIVE BLOCK");
    console.log("======================================\n");

    if (!currentBlock) {
      console.log(
        "No current block."
      );
    } else {

      console.log(
        "Type:",
        currentBlock.type
      );

      console.log(
        "Name:",
        currentBlock.blockName
      );

      console.log(
        "Start:",
        currentBlock.startTime
      );

      console.log(
        "End:",
        currentBlock.endTime
      );

      console.log(
        "Duration:",
        currentBlock.durationMinutes,
        "minutes"
      );

    }


    /* --------------------------------------------------------
       SHIFT STATUS
    -------------------------------------------------------- */

    const status =
      getShiftStatus({
        shiftStartTime:
          result.shiftStartTime,

        shiftEndTime:
          result.shiftEndTime,

        timeline:
          result.timeline,

        currentTime:
          new Date(),
      });


    console.log("\n======================================");
    console.log("SHIFT STATUS");
    console.log("======================================\n");

    console.log(
      "Current Status:",
      status
    );


    /* --------------------------------------------------------
       UPCOMING BLOCKS
    -------------------------------------------------------- */

    const upcoming =
      getUpcomingBlocks({
        timeline:
          result.timeline,

        currentTime:
          new Date(),
      });


    console.log("\n======================================");
    console.log("UPCOMING BLOCKS");
    console.log("======================================\n");

    if (!upcoming.length) {
      console.log(
        "No upcoming blocks."
      );
    }

    upcoming.forEach(
      (block) => {

        console.log(
          block.type,
          "|",
          block.blockName,
          "|",
          block.startTime,
          "→",
          block.endTime
        );

      }
    );


    console.log("\n======================================");
    console.log("TEST COMPLETED");
    console.log("======================================\n");


  } catch (error) {

    console.error(
      "\n❌ LIVE BLOCK TEST FAILED\n"
    );

    console.error(
      error
    );

  } finally {

    await mongoose.disconnect();

    console.log(
      "\nMongoDB disconnected."
    );

  }
};


/* ============================================================
   RUN
============================================================ */

runTest();