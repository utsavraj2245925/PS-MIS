import express from "express";

import {
  createReject,
  getAllRejects,
  getRejectById,
  updateReject,
  deleteReject,
} from "../controllers/reject.controller.js";

import {
  createRework,
  getAllReworks,
  getReworkById,
  updateRework,
  deleteRework,
} from "../controllers/rework.controller.js";

import {
  createDefect,
  getAllDefects,
  getDefectById,
  updateDefect,
  deleteDefect,
} from "../controllers/defects.controller.js";

const router = express.Router();

// Reject type names (used by the "Reject" card)
router.post("/reject", createReject);
router.get("/reject", getAllRejects);
router.get("/reject/:id", getRejectById);
router.put("/reject/:id", updateReject);
router.delete("/reject/:id", deleteReject);

// Rework type names (used by the "Rework" card)
router.post("/rework", createRework);
router.get("/rework", getAllReworks);
router.get("/rework/:id", getReworkById);
router.put("/rework/:id", updateRework);
router.delete("/rework/:id", deleteRework);

// Main defect occurrence records (links to reject/rework via type + defectType)
router.post("/", createDefect);
router.get("/", getAllDefects); // ?type=reject | ?type=rework
router.get("/:id", getDefectById);
router.put("/:id", updateDefect);
router.delete("/:id", deleteDefect);

export default router; 