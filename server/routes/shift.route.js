import express from "express";

import {
  createShift,
  updateShift,
  deleteShift,
  getAllShifts,
  getShiftsByPlant,
  getActiveShift,
  getShiftsByLocation,
} from "../controllers/shift.controller.js";

const router = express.Router();

/* ==========================================
   CREATE SHIFT
========================================== */

router.post("/", createShift);

/* ==========================================
   GET ALL SHIFTS
========================================== */

router.get("/", getAllShifts);

/* ==========================================
   GET SHIFTS BY LOCATION
========================================== */

router.get(
  "/location/:locationId",
  getShiftsByLocation
);

/* ==========================================
   GET SHIFTS BY PLANT
========================================== */

router.get(
  "/plant/:plantId",
  getShiftsByPlant
);

/* ==========================================
   GET ACTIVE SHIFT
========================================== */

router.get(
  "/active/:plantId",
  getActiveShift
);

/* ==========================================
   UPDATE SHIFT
========================================== */

router.put(
  "/:id",
  updateShift
);

/* ==========================================
   DELETE SHIFT
========================================== */

router.delete(
  "/:id",
  deleteShift
);

export default router;