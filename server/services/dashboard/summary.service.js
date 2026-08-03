import ProductionEntry from "../../models/production.model.js";
import Plant from "../../models/plants.model.js";
import Shift from "../../models/shift.model.js";
import Part from "../../models/parts.model.js";
import ConveyorStrength from "../../models/ConveyorStrength.model.js";

const sum = (arr, key) =>
  arr.reduce((total, item) => total + Number(item[key] || 0), 0);

export const getSummary = async (user, filters = {}) => {
  try {
    const {
      fromDate,
      toDate,
      plantId,
      locationId,
      shiftId,
    } = filters;

    /* ==============================
       DATE FILTER
    ============================== */
    const query = {};

    if (fromDate || toDate) {
      query.entryDate = {};

      if (fromDate) {
        query.entryDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        query.entryDate.$lte = new Date(toDate);
      }
    }

    // const startDate = fromDate
    //   ? new Date(fromDate)
    //   : new Date(new Date().setHours(0, 0, 0, 0));

    // const endDate = toDate
    //   ? new Date(toDate)
    //   : new Date(new Date().setHours(23, 59, 59, 999));

    // /* ==============================
    //    FILTER BUILDER
    // ============================== */

    // const query = {
    //   entryDate: {
    //     $gte: startDate,
    //     $lte: endDate,
    //   },
    // };

    /* ==============================
       ROLE BASED ACCESS
    ============================== */

    if (user.role === "Manager") {
      query.plantId = user.plantId;
    }

    if (user.role === "PlantAdmin") {
      if (plantId) query.plantId = plantId;
      if (locationId) query.locationId = locationId;
    }

    if (user.role === "SuperAdmin") {
      if (plantId) query.plantId = plantId;
      if (locationId) query.locationId = locationId;
    }

    if (shiftId) {
      query.shiftId = shiftId;
    }

    /* ==============================
       FETCH DATA
    ============================== */

    const entries = await ProductionEntry
      .find(query)
      .populate({
        path: "productions.partId",
        select: "area partsPerHanger",
      })
      .lean();

    console.log("DASHBOARD QUERY =", query);

    console.log(
      "TOTAL PRODUCTION ENTRIES FOUND =",
      entries.length
    );

    console.log(
      "FIRST ENTRY =",
      entries[0]
    );

    /* ==============================
       PRODUCTION
    ============================== */

    const production = sum(
      entries,
      "totalProductionQty"
    );

    const target = entries.reduce(
      (total, entry) =>
        total +
        Number(
          entry?.shiftSummary?.target || 0
        ),
      0
    );

    const achievement =
      target > 0
        ? Number(
            (
              (production / target) *
              100
            ).toFixed(2)
          )
        : 0;

    /* ==============================
       REJECT / REWORK
    ============================== */

    const rejectQty = sum(
      entries,
      "totalRejectQty"
    );

    const reworkQty = sum(
      entries,
      "totalReworkQty"
    );

    const rejectPercent =
      production > 0
        ? Number(
            (
              (rejectQty / production) *
              100
            ).toFixed(2)
          )
        : 0;

    const reworkPercent =
      production > 0
        ? Number(
            (
              (reworkQty / production) *
              100
            ).toFixed(2)
          )
        : 0;

    /* ==============================
       QUALITY
    ============================== */

    const goodProduction =
      production - rejectQty;

    const quality =
      production > 0
        ? Number(
            (
              (goodProduction /
                production) *
              100
            ).toFixed(2)
          )
        : 0;

    /* ==============================
       DOWNTIME
    ============================== */

    const downtime = sum(
      entries,
      "totalDowntime"
    );
    
    

    /* ==============================
       MANPOWER
    ============================== */

    const shortManpower = sum(
      entries,
      "shortageManpower"
    );

    /* ==============================
       PAINT USAGE
    ============================== */

    let paintUsage = 0;

    entries.forEach((entry) => {
      if (
        Array.isArray(entry.consumables)
      ) {
        entry.consumables.forEach(
          (item) => {
            paintUsage += Number(
              item.quantity || 0
            );
          }
        );
      }
    });

    /* ==============================
       PAINTED AREA
    ============================== */

  let paintedArea = 0;

    entries.forEach((entry) => {

      entry.productions?.forEach((row) => {

        const qty =
          Number(row.productionQty || 0);

        const areaMM2 =
          Number(
            row.partId?.area || 0
          );

        paintedArea +=
          (qty * areaMM2) / 1000000;

      });

    });

    /* ==============================
       HANGER UTILIZATION
    ============================== */

    let usedHangers = 0;

      entries.forEach((entry) => {

        entry.productions?.forEach((row) => {

          const qty =
            Number(row.productionQty || 0);

          const partsPerHanger =
            Number(
              row.partId?.partsPerHanger || 1
            );

          usedHangers +=
            qty / partsPerHanger;

        });

      });
    //
    const strengthQuery = {
      status: "Active",
    };

    if (query.plantId) {
      strengthQuery.plantId =
        query.plantId;
    }

    if (query.shiftId) {
      strengthQuery.shiftId =
        query.shiftId;
    }

    const strengths =
      await ConveyorStrength.find(
        strengthQuery
      ).lean();

    const effectiveHangers =
      strengths.reduce(
        (total, item) =>
          total +
          Number(
            item.effectiveHangerPerShift || 0
          ),
        0
      );
    

    const hangerUtilization =
      effectiveHangers > 0
        ? Number(
            (
              (usedHangers /
                effectiveHangers) *
              100
            ).toFixed(2)
          )
        : 0;

    /* ==============================
       AVAILABILITY
    ============================== */

    const availability =
      downtime > 0
        ? Number(
            (
              100 -
              downtime / 10
            ).toFixed(2)
          )
        : 100;

    /* ==============================
       PERFORMANCE
    ============================== */

    const performance =
      achievement;

    /* ==============================
       OEE
    ============================== */

    const oee = Number(
      (
        (availability *
          performance *
          quality) /
        10000
      ).toFixed(2)
    );

    /* ==============================
       PRODUCTION RATE
    ============================== */

    const productionRate =
      production > 0
        ? Number(
            (
              production / 12
            ).toFixed(2)
          )
        : 0;

    /* ==============================
       RESPONSE
    ============================== */

    return {
      cards: {
        production,
        target,
        achievement,

        paintedArea,

        hangerUtilization,

        oee,

        quality,

        availability,

        rejectPercent,

        reworkPercent,

        downtime,

        paintUsage,

        shortManpower,

        productionRate,
      },
    };
  } catch (error) {
    console.error(
      "SUMMARY SERVICE ERROR:",
      error
    );

    throw error;
  }
};