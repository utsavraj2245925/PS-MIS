import express from "express";
import {
  getDashboardSummary,
  getFilterOptions,
  getProductionTrend,
  getAchievementTrend,
  getProductionRateTrend,
  getOEETrend,
  getQualityTrend,
  getQualityPerformanceTrend,
  getDefectDistribution,
  getDefectPareto,
} from "../controllers/dashboard.controller.js";
import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();

router.get("/summary", isAuthenticated, getDashboardSummary);
router.get("/filter-options", isAuthenticated, getFilterOptions);
router.get("/production-trend", isAuthenticated, getProductionTrend);
router.get("/achievement-trend", isAuthenticated, getAchievementTrend);
router.get("/production-rate-trend", isAuthenticated, getProductionRateTrend);
router.get("/oee-trend", isAuthenticated, getOEETrend);
router.get("/quality-trend", isAuthenticated, getQualityTrend);
router.get("/quality-performance-trend", isAuthenticated, getQualityPerformanceTrend);
router.get("/defect-distribution", isAuthenticated, getDefectDistribution);
router.get("/defect-pareto", isAuthenticated, getDefectPareto);

export default router;