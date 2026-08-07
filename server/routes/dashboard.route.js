import express from "express";
import {
  getDashboardSummary,
  getFilterOptions,
  getProductionTrend,
  getAchievementTrend,
} from "../controllers/dashboard.controller.js";
import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();

router.get("/summary", isAuthenticated, getDashboardSummary);
router.get("/filter-options", isAuthenticated, getFilterOptions);
router.get("/production-trend", isAuthenticated, getProductionTrend);
router.get("/achievement-trend", isAuthenticated, getAchievementTrend);

export default router;