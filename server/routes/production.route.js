import express from "express";

import {
  createProductionEntry,
  getAllProductionEntries,
  getSingleProductionEntry,
  updateProductionEntry,
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
// GET ALL ENTRIES (supports query filters:
// plantId, modelId, partId, userId, shift, status, startDate, endDate, page, limit)
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
// UPDATE ENTRY
// ======================================

router.put(
  "/production-entry/:id",
  updateProductionEntry
);

// ======================================
// DELETE ENTRY
// ======================================

router.delete(
  "/production-entry/:id",
  deleteProductionEntry
);

export default router;