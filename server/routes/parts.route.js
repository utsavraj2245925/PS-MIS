import express from "express";

import {
  createPart,
  getParts,
  updatePart,
  deletePart,
  getFilterParts,
  getSinglePart,
} from "../controllers/parts.controller.js";

const router = express.Router();

// ==========================================
// CREATE PART
// ==========================================
router.post("/parts", createPart);

// ==========================================
// GET ALL PARTS
// ==========================================
router.get("/parts", getParts);

// ==========================================
// FILTER PARTS
// IMPORTANT:
// keep ABOVE /:id
// ==========================================
router.get("/parts/filter", getFilterParts);

// ==========================================
// GET SINGLE PART
// ==========================================
router.get("/parts/:id", getSinglePart);

// ==========================================
// UPDATE PART
// ==========================================
router.put("/parts/:id", updatePart);

// ==========================================
// DELETE PART
// ==========================================
router.delete("/parts/:id", deletePart);

export default router;