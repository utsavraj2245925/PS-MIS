import {
  buildShiftTimeline,
} from "./liveBlock.utils.js";


console.log("\n======================================");
console.log("   NIGHT SHIFT DYNAMIC BLOCK TEST");
console.log("======================================\n");


const nightShift = {
  shiftName: "Temporary Night Shift Test",

  shiftType: "Night",

  shiftStartTime: "19:30",

  shiftEndTime: "07:30",

  breaks: [
    {
      breakName: "Night Break",

      startTime: "00:30",

      endTime: "01:00",

      durationMinutes: 30,
    },
  ],
};


try {

  const result = buildShiftTimeline({
    shift: nightShift,

    baseDate: new Date(),
  });


  console.log("Shift Start:");
  console.log(result.shiftStartTime);

  console.log("\nShift End:");
  console.log(result.shiftEndTime);

  console.log("\nCrosses Midnight:");
  console.log(result.crossesMidnight);

  console.log("\nTotal Shift Minutes:");
  console.log(result.totalShiftMinutes);

  console.log("\nTotal Break Minutes:");
  console.log(result.totalBreakMinutes);

  console.log("\nActual Working Minutes:");
  console.log(result.actualWorkingMinutes);


  console.log("\n======================================");
  console.log("TIMELINE");
  console.log("======================================\n");


  result.timeline.forEach((item) => {

    console.log(
      item.type,
      "|",
      item.blockName,
      "|",
      item.startTime,
      "→",
      item.endTime,
      "|",
      item.durationMinutes,
      "min"
    );

  });


  console.log("\n======================================");
  console.log("TEST COMPLETED");
  console.log("======================================\n");


} catch (error) {

  console.error(
    "\n❌ NIGHT SHIFT TEST FAILED\n"
  );

  console.error(error);

}