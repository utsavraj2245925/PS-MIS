import express from "express";

import {
  getLocations,
  getLocationById,
} from "../controllers/location.controller.js";

const router = express.Router();

/* ==========================================
   GET ALL LOCATIONS
========================================== */

router.get("/", getLocations);

/* ==========================================
   GET SINGLE LOCATION
========================================== */

router.get("/:id", getLocationById);

export default router;