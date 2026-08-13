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
  getPowderConsumption,
  getUsefulItems,
  getChemicalConsumption,
  getDowntimeTrend,
  getDowntimeTypeDistribution,
  getTopDowntimeReasons,
  getDowntimePareto,
  getManpowerTrend,
  getManpowerDistribution,
  getManpowerShortageByShift,
  getShiftProductionPerformance,
  getShiftOEEPerformance,
  getShiftQualityPerformance,
  getShiftDowntimePerformance,
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
router.get("/powder-consumption", isAuthenticated, getPowderConsumption);
router.get("/useful-items", isAuthenticated, getUsefulItems);
router.get("/chemical-consumption", isAuthenticated, getChemicalConsumption);

router.get("/downtime-trend", isAuthenticated, getDowntimeTrend);
router.get("/downtime-type-distribution", isAuthenticated, getDowntimeTypeDistribution);
router.get("/top-downtime-reasons", isAuthenticated, getTopDowntimeReasons);
router.get("/downtime-pareto", isAuthenticated, getDowntimePareto);

router.get("/manpower-trend", isAuthenticated, getManpowerTrend);
router.get("/manpower-distribution", isAuthenticated, getManpowerDistribution);
router.get("/manpower-shortage-by-shift", isAuthenticated, getManpowerShortageByShift);
router.get("/shift-production-performance", isAuthenticated, getShiftProductionPerformance);
router.get("/shift-oee-performance", isAuthenticated, getShiftOEEPerformance);
router.get("/shift-quality-performance", isAuthenticated, getShiftQualityPerformance);
router.get("/shift-downtime-performance", isAuthenticated, getShiftDowntimePerformance);

export default router;