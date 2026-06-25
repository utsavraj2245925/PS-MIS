import express from "express";

import {
  createProductionEntry,
  getProductionEntries,
} from "../controllers/productionEntryController.js";

const router = express.Router();

router.post("/production-entry", createProductionEntry);

router.get("/production-entry", getProductionEntries);

export default router;