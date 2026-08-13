import Plant from "../models/plants.model.js";
import Location from "../models/location.model.js";
import Shift from "../models/shift.model.js";
import { dashboardSummaryService } from "../services/dashboard.service.js";
import {
  getProductionTrend as getProductionTrendService,
  getAchievementTrend as getAchievementTrendService,
  getProductionRateTrend as getProductionRateTrendService,
  getOEETrend as getOEETrendService,
  getQualityTrend as getQualityTrendService,
  getQualityPerformanceTrend as getQualityPerformanceTrendService,
} from "../services/dashboard/productionTrend.service.js";
import {
  getDefectDistribution as getDefectDistributionService,
  getDefectPareto as getDefectParetoService,
} from "../services/dashboard/defectAnalytics.service.js";
import {
  getTopModels as getTopModelsService,
  getTopParts as getTopPartsService,
  getModelProductionContribution as getModelProductionContributionService,
  getPartPerformanceDistribution as getPartPerformanceDistributionService,
} from "../services/dashboard/modelPartAnalytics.service.js";
import {
  getPowderConsumption as getPowderConsumptionService,
  getUsefulItems as getUsefulItemsService,
  getChemicalConsumption as getChemicalConsumptionService,
} from "../services/dashboard/paintShopAnalytics.service.js";
import {
  getDailyDowntimeSeries as getDailyDowntimeSeriesService,
  getDowntimeTypeDistribution as getDowntimeTypeDistributionService,
  getTopDowntimeReasons as getTopDowntimeReasonsService,
  getDowntimePareto as getDowntimeParetoService,
} from "../services/dashboard/downtimeAnalytics.service.js";
import {
  getManpowerDailySeries as getManpowerDailySeriesService,
  getManpowerDistribution as getManpowerDistributionService,
  getManpowerShortageByShift as getManpowerShortageByShiftService,
} from "../services/dashboard/manpowerAnalytics.service.js";
import {
  getShiftProductionPerformance as getShiftProductionPerformanceService,
  getShiftOEEPerformance as getShiftOEEPerformanceService,
  getShiftQualityPerformance as getShiftQualityPerformanceService,
  getShiftDowntimePerformance as getShiftDowntimePerformanceService,
} from "../services/dashboard/shiftAnalytics.service.js";

const extractConveyors = (plants = []) => {
  const conveyors = [];
  for (const plant of plants) {
    for (const conveyor of plant.conveyors || []) {
      if (conveyor.status === "Active") {
        conveyors.push({
          _id: conveyor._id,
          conveyorName: conveyor.conveyorName,
          plantId: plant._id,
        });
      }
    }
  }
  return conveyors;
};

const extractFilters = (req) => ({
  fromDate: req.query.fromDate,
  toDate: req.query.toDate,
  shiftId: req.query.shiftId,
  plantId: req.query.plantId,
  locationId: req.query.locationId,
  conveyorId: req.query.conveyorId,
});

export const getDashboardSummary = async (req, res) => {
  try {
    const data = await dashboardSummaryService(req.user, extractFilters(req));

    return res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data,
    });
  } catch (error) {
    console.error("DASHBOARD SUMMARY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dashboard summary",
    });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const user = req.user;
    const userLocationId = user.locationId?._id || user.locationId || null;
    const userPlantId    = user.plantId?._id || user.plantId || null;

    let locations = [];
    let plants = [];
    let shifts = [];
    let conveyors = [];

    if (user.role === "superAdmin") {
      locations = await Location.find({ status: "Active" }).select("_id locationName").lean();
      plants = await Plant.find({ status: "Active" }).select("_id plantName locationId conveyors").lean();
      shifts = await Shift.find({ status: "Active" }).select("_id shiftName plantId").lean();
      conveyors = extractConveyors(plants);
    }

    else if (user.role === "plantAdmin") {
      if (userLocationId) {
        const location = await Location.findById(userLocationId).select("_id locationName").lean();
        if (location) locations = [location];

        plants = await Plant.find({ locationId: userLocationId, status: "Active" })
          .select("_id plantName locationId conveyors").lean();

        const plantIds = plants.map((p) => p._id);
        shifts = await Shift.find({ plantId: { $in: plantIds }, status: "Active" })
          .select("_id shiftName plantId").lean();

        conveyors = extractConveyors(plants);
      }
    }

    else if (user.role === "manager") {
      if (userPlantId) {
        const plant = await Plant.findOne({ _id: userPlantId, status: "Active" })
          .select("_id plantName locationId conveyors").lean();

        if (plant) {
          plants = [plant];
          conveyors = extractConveyors(plants);
        }

        shifts = await Shift.find({ plantId: userPlantId, status: "Active" })
          .select("_id shiftName plantId").lean();
      }
    }

    return res.status(200).json({
      success: true,
      data: { locations, plants, shifts, conveyors },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to load filters" });
  }
};

export const getProductionTrend = async (req, res) => {
  try {
    const data = await getProductionTrendService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Production trend fetched successfully", data });
  } catch (error) {
    console.error("PRODUCTION TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch production trend" });
  }
};

export const getAchievementTrend = async (req, res) => {
  try {
    const data = await getAchievementTrendService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Achievement trend fetched successfully", data });
  } catch (error) {
    console.error("ACHIEVEMENT TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch achievement trend" });
  }
};

export const getProductionRateTrend = async (req, res) => {
  try {
    const data = await getProductionRateTrendService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Production rate trend fetched successfully", data });
  } catch (error) {
    console.error("PRODUCTION RATE TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch production rate trend" });
  }
};

export const getOEETrend = async (req, res) => {
  try {
    const data = await getOEETrendService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "OEE trend fetched successfully", data });
  } catch (error) {
    console.error("OEE TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch OEE trend" });
  }
};

export const getQualityTrend = async (req, res) => {
  try {
    const data = await getQualityTrendService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Quality trend fetched successfully", data });
  } catch (error) {
    console.error("QUALITY TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch quality trend" });
  }
};

export const getQualityPerformanceTrend = async (req, res) => {
  try {
    const data = await getQualityPerformanceTrendService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Quality performance trend fetched successfully", data });
  } catch (error) {
    console.error("QUALITY PERFORMANCE TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch quality performance trend" });
  }
};

export const getDefectDistribution = async (req, res) => {
  try {
    const data = await getDefectDistributionService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Defect distribution fetched successfully", data });
  } catch (error) {
    console.error("DEFECT DISTRIBUTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch defect distribution" });
  }
};

export const getDefectPareto = async (req, res) => {
  try {
    const data = await getDefectParetoService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Defect pareto fetched successfully", data });
  } catch (error) {
    console.error("DEFECT PARETO ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch defect pareto" });
  }
};

export const getTopModels = async (req, res) => {
  try {
    const data = await getTopModelsService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Top models fetched successfully", data });
  } catch (error) {
    console.error("TOP MODELS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch top models" });
  }
};

export const getTopParts = async (req, res) => {
  try {
    const data = await getTopPartsService(req.user, extractFilters(req), req.query.modelId || null);
    return res.status(200).json({ success: true, message: "Top parts fetched successfully", data });
  } catch (error) {
    console.error("TOP PARTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch top parts" });
  }
};

export const getModelProductionContribution = async (req, res) => {
  try {
    const data = await getModelProductionContributionService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Model production contribution fetched successfully", data });
  } catch (error) {
    console.error("MODEL CONTRIBUTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch model production contribution" });
  }
};

export const getPartPerformanceDistribution = async (req, res) => {
  try {
    const data = await getPartPerformanceDistributionService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Part performance distribution fetched successfully", data });
  } catch (error) {
    console.error("PART DISTRIBUTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch part performance distribution" });
  }
};

export const getPowderConsumption = async (req, res) => {
  try {
    const data = await getPowderConsumptionService(req.user, extractFilters(req), req.query.materialId || null);
    return res.status(200).json({ success: true, message: "Powder consumption fetched successfully", data });
  } catch (error) {
    console.error("POWDER CONSUMPTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch powder consumption" });
  }
};

export const getUsefulItems = async (req, res) => {
  try {
    const data = await getUsefulItemsService(req.user, extractFilters(req), req.query.materialId || null);
    return res.status(200).json({ success: true, message: "Useful items fetched successfully", data });
  } catch (error) {
    console.error("USEFUL ITEMS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch useful items" });
  }
};

export const getChemicalConsumption = async (req, res) => {
  try {
    const data = await getChemicalConsumptionService(req.user, extractFilters(req), req.query.materialId || null);
    return res.status(200).json({ success: true, message: "Chemical consumption fetched successfully", data });
  } catch (error) {
    console.error("CHEMICAL CONSUMPTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch chemical consumption" });
  }
};

export const getDowntimeTrend = async (req, res) => {
  try {
    const data = await getDailyDowntimeSeriesService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Downtime trend fetched successfully", data });
  } catch (error) {
    console.error("DOWNTIME TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch downtime trend" });
  }
};

export const getDowntimeTypeDistribution = async (req, res) => {
  try {
    const data = await getDowntimeTypeDistributionService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Downtime type distribution fetched successfully", data });
  } catch (error) {
    console.error("DOWNTIME TYPE DISTRIBUTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch downtime type distribution" });
  }
};

export const getTopDowntimeReasons = async (req, res) => {
  try {
    const data = await getTopDowntimeReasonsService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Top downtime reasons fetched successfully", data });
  } catch (error) {
    console.error("TOP DOWNTIME REASONS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch top downtime reasons" });
  }
};

export const getDowntimePareto = async (req, res) => {
  try {
    const data = await getDowntimeParetoService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Downtime pareto fetched successfully", data });
  } catch (error) {
    console.error("DOWNTIME PARETO ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch downtime pareto" });
  }
};

// Add these 3 handlers at the very end of the file
export const getManpowerTrend = async (req, res) => {
  try {
    const data = await getManpowerDailySeriesService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Manpower trend fetched successfully", data });
  } catch (error) {
    console.error("MANPOWER TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch manpower trend" });
  }
};

export const getManpowerDistribution = async (req, res) => {
  try {
    const data = await getManpowerDistributionService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Manpower distribution fetched successfully", data });
  } catch (error) {
    console.error("MANPOWER DISTRIBUTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch manpower distribution" });
  }
};

export const getManpowerShortageByShift = async (req, res) => {
  try {
    const data = await getManpowerShortageByShiftService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Manpower shortage by shift fetched successfully", data });
  } catch (error) {
    console.error("MANPOWER SHORTAGE BY SHIFT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch manpower shortage by shift" });
  }
};
export const getShiftProductionPerformance = async (req, res) => {
  try {
    const data = await getShiftProductionPerformanceService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Shift production performance fetched successfully", data });
  } catch (error) {
    console.error("SHIFT PRODUCTION PERFORMANCE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch shift production performance" });
  }
};

export const getShiftOEEPerformance = async (req, res) => {
  try {
    const data = await getShiftOEEPerformanceService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Shift OEE performance fetched successfully", data });
  } catch (error) {
    console.error("SHIFT OEE PERFORMANCE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch shift OEE performance" });
  }
};

export const getShiftQualityPerformance = async (req, res) => {
  try {
    const data = await getShiftQualityPerformanceService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Shift quality performance fetched successfully", data });
  } catch (error) {
    console.error("SHIFT QUALITY PERFORMANCE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch shift quality performance" });
  }
};

export const getShiftDowntimePerformance = async (req, res) => {
  try {
    const data = await getShiftDowntimePerformanceService(req.user, extractFilters(req));
    return res.status(200).json({ success: true, message: "Shift downtime performance fetched successfully", data });
  } catch (error) {
    console.error("SHIFT DOWNTIME PERFORMANCE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch shift downtime performance" });
  }
};