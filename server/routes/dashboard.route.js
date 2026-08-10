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
  getTopModels,
  getTopParts,
  getModelProductionContribution,
  getPartPerformanceDistribution,
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
router.get("/top-models", isAuthenticated, getTopModels);
router.get("/top-parts", isAuthenticated, getTopParts);
router.get("/model-production-contribution", isAuthenticated, getModelProductionContribution);
router.get("/part-performance-distribution", isAuthenticated, getPartPerformanceDistribution);

export default router;