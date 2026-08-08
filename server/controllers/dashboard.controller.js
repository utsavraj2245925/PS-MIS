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

export const getDashboardSummary = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      shiftId: req.query.shiftId,
      plantId: req.query.plantId,
      locationId: req.query.locationId,
      conveyorId: req.query.conveyorId,
    };

    const data = await dashboardSummaryService(req.user, filters);

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
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getProductionTrendService(req.user, filters);
    return res.status(200).json({ success: true, message: "Production trend fetched successfully", data });
  } catch (error) {
    console.error("PRODUCTION TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch production trend" });
  }
};

export const getAchievementTrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getAchievementTrendService(req.user, filters);
    return res.status(200).json({ success: true, message: "Achievement trend fetched successfully", data });
  } catch (error) {
    console.error("ACHIEVEMENT TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch achievement trend" });
  }
};

export const getProductionRateTrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getProductionRateTrendService(req.user, filters);
    return res.status(200).json({ success: true, message: "Production rate trend fetched successfully", data });
  } catch (error) {
    console.error("PRODUCTION RATE TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch production rate trend" });
  }
};

export const getOEETrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getOEETrendService(req.user, filters);
    return res.status(200).json({ success: true, message: "OEE trend fetched successfully", data });
  } catch (error) {
    console.error("OEE TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch OEE trend" });
  }
};

export const getQualityTrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getQualityTrendService(req.user, filters);
    return res.status(200).json({ success: true, message: "Quality trend fetched successfully", data });
  } catch (error) {
    console.error("QUALITY TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch quality trend" });
  }
};

export const getQualityPerformanceTrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getQualityPerformanceTrendService(req.user, filters);
    return res.status(200).json({ success: true, message: "Quality performance trend fetched successfully", data });
  } catch (error) {
    console.error("QUALITY PERFORMANCE TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch quality performance trend" });
  }
};

export const getDefectDistribution = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getDefectDistributionService(req.user, filters);
    return res.status(200).json({ success: true, message: "Defect distribution fetched successfully", data });
  } catch (error) {
    console.error("DEFECT DISTRIBUTION ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch defect distribution" });
  }
};

export const getDefectPareto = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate, toDate: req.query.toDate,
      shiftId: req.query.shiftId, plantId: req.query.plantId,
      locationId: req.query.locationId, conveyorId: req.query.conveyorId,
    };
    const data = await getDefectParetoService(req.user, filters);
    return res.status(200).json({ success: true, message: "Defect pareto fetched successfully", data });
  } catch (error) {
    console.error("DEFECT PARETO ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch defect pareto" });
  }
};