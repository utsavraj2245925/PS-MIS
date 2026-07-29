/* ============================================================
   CONVEYOR CALCULATION SERVICE
   ------------------------------------------------------------
   Paint Shop MIS

   Responsible For:
   ✔ Total Hangers
   ✔ Process Time
   ✔ Conveyor Rounds / Shift
   ✔ Hanger Per Minute
   ✔ Available Hangers
   ✔ Effective Hangers
   ✔ Capacity Status
============================================================ */

/* ============================================================
   SAFE NUMBER
============================================================ */

const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

/* ============================================================
   MAIN CALCULATION
============================================================ */

export const calculateConveyorMetrics = ({
    conveyorLength,
    conveyorSpeed,
    pitchDistance,
    availableTime,
    hangerEfficiency,
    demandPerShift,
}) => {

    conveyorLength = num(conveyorLength);
    conveyorSpeed = num(conveyorSpeed);
    pitchDistance = num(pitchDistance);
    availableTime = num(availableTime);
    hangerEfficiency = num(hangerEfficiency);
    demandPerShift = num(demandPerShift);

    /* ======================================================
       1. TOTAL HANGERS
       Formula:
       Conveyor Length / Pitch Distance
    ====================================================== */

    const totalHangers =
        pitchDistance > 0
            ? Math.floor(conveyorLength / pitchDistance)
            : 0;

    /* ======================================================
       2. PROCESS TIME (Minutes)
       Formula:
       Conveyor Length / Conveyor Speed
    ====================================================== */

    const processTime =
        conveyorSpeed > 0
            ? Number((conveyorLength / conveyorSpeed).toFixed(2))
            : 0;

    /* ======================================================
       3. TOTAL ROUNDS / SHIFT
       Formula:
       Available Time / Process Time
    ====================================================== */

    const totalRoundsShift =
        processTime > 0
            ? Number((availableTime / processTime).toFixed(2))
            : 0;

    /* ======================================================
       4. HANGER / MINUTE
       Formula:
       Conveyor Speed / Pitch Distance
    ====================================================== */

    const hangerPerMinute =
        pitchDistance > 0
            ? Number((conveyorSpeed / pitchDistance).toFixed(2))
            : 0;

    /* ======================================================
       5. AVAILABLE HANGERS / SHIFT
    ====================================================== */

    const availableHangerPerShift =
        Math.round(hangerPerMinute * availableTime);

    /* ======================================================
       6. EFFECTIVE HANGERS / SHIFT
    ====================================================== */

    const effectiveHangerPerShift =
        Math.round(
            availableHangerPerShift *
            (hangerEfficiency / 100)
        );

    /* ======================================================
       7. CAPACITY DIFFERENCE

       +ve  = Surplus
       -ve  = Shortage
       0    = Balanced
    ====================================================== */

    const capacityDifference =
        effectiveHangerPerShift - demandPerShift;

    /* ======================================================
       8. ACHIEVEMENT %

       Production Capacity
       -------------------
       Demand Per Shift
    ====================================================== */

    const achievementPercent =
        demandPerShift > 0
            ? Number(
                  (
                      (effectiveHangerPerShift /
                          demandPerShift) *
                      100
                  ).toFixed(1)
              )
            : 0;

    /* ======================================================
       9. CAPACITY STATUS
    ====================================================== */

    let capacityStatus = "Balanced";

    if (capacityDifference > 0) {
        capacityStatus = "Surplus";
    } else if (capacityDifference < 0) {
        capacityStatus = "Shortage";
    }

    /* ======================================================
       RETURN
    ====================================================== */

    return {

        totalHangers,

        processTime,

        totalRoundsShift,

        hangerPerMinute,

        availableHangerPerShift,

        effectiveHangerPerShift,

        achievementPercent,

        capacityDifference,

        capacityStatus,

    };

};