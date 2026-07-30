import express from "express";

import {
  createProductionEntry,
  getproductions,
  getSingleProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
} from "../controllers/production.controller.js";

import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();

/* ==========================================
   AUTH MIDDLEWARE
========================================== */

router.use(isAuthenticated);

/* ==========================================
   CREATE PRODUCTION ENTRY
========================================== */

router.post(
  "/",
  createProductionEntry
);

/* ==========================================
   GET ALL PRODUCTION ENTRIES
   Query:
   ?shiftId=
   ?from=
   ?to=
========================================== */

router.get(
  "/",
  getproductions
);

/* ==========================================
   GET SINGLE ENTRY
========================================== */

router.get(
  "/:id",
  getSingleProductionEntry
);

/* ==========================================
   UPDATE ENTRY
========================================== */

router.put(
  "/:id",
  updateProductionEntry
);

/* ==========================================
   DELETE ENTRY
========================================== */

router.delete(
  "/:id",
  deleteProductionEntry
);

export default router;