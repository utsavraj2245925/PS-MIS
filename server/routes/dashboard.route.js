import express from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { isAuthenticated } from "../Auth/isAuthenticated.js";
import { getFilterOptions } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get(
  "/summary",
  isAuthenticated,
  getDashboardSummary
);
router.get(
  "/filter-options",
  isAuthenticated,
  getFilterOptions
);

export default router;