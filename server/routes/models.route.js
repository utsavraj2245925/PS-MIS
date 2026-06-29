import express from "express";

import { isAuthenticated } from "../Auth/isAuthenticated.js";

import {
  createModel,
  getModels,
  getSingleModel,
  updateModel,
  deleteModel,
  filterModels,
} from "../controllers/models.controller.js";

const router = express.Router();

// ── Apply auth to every model route ──────────────────────────────────────────
router.use(isAuthenticated);

// ==========================================
// CREATE MODEL
// ==========================================
router.post("/models", createModel);

// ==========================================
// GET ALL MODELS
// ==========================================
router.get("/models", getModels);

// ==========================================
// FILTER MODELS
// IMPORTANT: keep this ABOVE /:id route
// ==========================================
router.get("/models/filter", filterModels);

// ==========================================
// GET SINGLE MODEL
// ==========================================
router.get("/models/:id", getSingleModel);

// ==========================================
// UPDATE MODEL
// ==========================================
router.put("/models/:id", updateModel);

// ==========================================
// DELETE MODEL
// ==========================================
router.delete("/models/:id", deleteModel);

export default router;