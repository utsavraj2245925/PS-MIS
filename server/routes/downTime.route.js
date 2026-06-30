import express from "express";
import {
  createDowntimeType,
  getAllDowntimeTypes,
  getDowntimeTypeById,
  updateDowntimeType,
  deleteDowntimeType,
} from "../controllers/downtime.controller.js"

const router = express.Router();

router.post("/", createDowntimeType);
router.get("/", getAllDowntimeTypes); // ?type=Planned | Unplanned
router.get("/:id", getDowntimeTypeById);
router.put("/:id", updateDowntimeType);
router.delete("/:id", deleteDowntimeType);

export default router;