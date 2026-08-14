import express from "express";

import {
  createTimeBlockConfiguration,
  getAllTimeBlockConfigurations,
  getTimeBlockConfigurationById,
  getTimeBlocksByLocation,
  getTimeBlocksByPlant,
  getTimeBlocksByShift,
  getActiveTimeBlockConfiguration,
  updateTimeBlockConfiguration,
  toggleTimeBlockConfigurationStatus,
  deleteTimeBlockConfiguration,
  generateHourlyBlocks,
  getCurrentTimeBlock,
} from "../controllers/timeBlock.controller.js";

const router = express.Router();

/* ============================================================
   TIME-BLOCK CONFIGURATION
============================================================ */

// Create new configuration
router.post("/", createTimeBlockConfiguration);

// Get all configurations
router.get("/", getAllTimeBlockConfigurations);

// Get active configuration
router.get("/active", getActiveTimeBlockConfiguration);

// Get current time-block
router.get("/current", getCurrentTimeBlock);

// Generate hourly blocks
router.post("/generate-hourly", generateHourlyBlocks);

// Get configurations by location
router.get("/location/:locationId", getTimeBlocksByLocation);

// Get configurations by plant
router.get("/plant/:plantId", getTimeBlocksByPlant);

// Get configurations by shift
router.get("/shift/:shiftId", getTimeBlocksByShift);

// Get configuration by ID
router.get("/:id", getTimeBlockConfigurationById);

// Update configuration
router.put("/:id", updateTimeBlockConfiguration);

// Activate / Deactivate configuration
router.patch("/:id/status", toggleTimeBlockConfigurationStatus);

// Delete configuration
router.delete("/:id", deleteTimeBlockConfiguration);

export default router;