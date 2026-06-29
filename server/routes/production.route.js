import express from "express";

import {
  createProductionEntry,
  getAllProductionEntries,
  getSingleProductionEntry,
  deleteProductionEntry,
} from "../controllers/production.controller.js";

const router = express.Router();

// ======================================
// CREATE ENTRY
// ======================================

router.post(
  "/production-entry",
  createProductionEntry
);

// ======================================
// GET ALL ENTRIES
// ======================================

router.get(
  "/production-entry",
  getAllProductionEntries
);

// ======================================
// GET SINGLE ENTRY
// ======================================

router.get(
  "/production-entry/:id",
  getSingleProductionEntry
);

// ======================================
// DELETE ENTRY
// ======================================

router.delete(
  "/production-entry/:id",
  deleteProductionEntry
);

export default router;