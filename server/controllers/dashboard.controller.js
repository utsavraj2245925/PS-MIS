import Plant from "../models/plants.model.js";
import Location from "../models/location.model.js";
import Shift from "../models/shift.model.js";
import { dashboardSummaryService }
from "../services/dashboard.service.js";
////
import {
  getProductionTrend as getProductionTrendService,
  getAchievementTrend as getAchievementTrendService,
} from "../services/dashboard/productionTrend.service.js";

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

export const getDashboardSummary =
  async (req, res) => {
    try {

      const filters = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        shiftId: req.query.shiftId,
        plantId: req.query.plantId,
        locationId: req.query.locationId,
        conveyorId: req.query.conveyorId,
      };

      const data =
        await dashboardSummaryService(
          req.user,
          filters
        );

      return res.status(200).json({
        success: true,
        message:
          "Dashboard summary fetched successfully",
        data,
      });

    } catch (error) {

      console.error(
        "DASHBOARD SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch dashboard summary",
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

    // SUPER ADMIN — sees All Locations, All Plants, All Shifts, All Conveyors
    if (user.role === "superAdmin") {

      locations = await Location.find({ status: "Active" })
        .select("_id locationName")
        .lean();

      plants = await Plant.find({ status: "Active" })
        .select("_id plantName locationId conveyors")
        .lean();

      shifts = await Shift.find({ status: "Active" })
        .select("_id shiftName plantId")
        .lean();

      conveyors = extractConveyors(plants);
    }

    // PLANT ADMIN — pinned to own location; sees all plants, shifts, conveyors under it
    else if (user.role === "plantAdmin") {

      if (userLocationId) {
        const location = await Location.findById(userLocationId)
          .select("_id locationName")
          .lean();

        if (location) locations = [location];

        plants = await Plant.find({ locationId: userLocationId, status: "Active" })
          .select("_id plantName locationId conveyors")
          .lean();

        const plantIds = plants.map((p) => p._id);

        shifts = await Shift.find({ plantId: { $in: plantIds }, status: "Active" })
          .select("_id shiftName plantId")
          .lean();

        conveyors = extractConveyors(plants);
      }
    }

    // MANAGER — pinned to own plant; sees all shifts and conveyors of that plant
    else if (user.role === "manager") {

      if (userPlantId) {
        const plant = await Plant.findOne({ _id: userPlantId, status: "Active" })
          .select("_id plantName locationId conveyors")
          .lean();

        if (plant) {
          plants = [plant];
          conveyors = extractConveyors(plants);
        }

        shifts = await Shift.find({ plantId: userPlantId, status: "Active" })
          .select("_id shiftName plantId")
          .lean();
      }
    }

    // USER — no filters; arrays stay empty.

    return res.status(200).json({
      success: true,
      data: {
        locations,
        plants,
        shifts,
        conveyors,
      },
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to load filters",
    });

  }
};
// add these two exports at the bottom of the file
export const getProductionTrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      shiftId: req.query.shiftId,
      plantId: req.query.plantId,
      locationId: req.query.locationId,
      conveyorId: req.query.conveyorId,
    };

    const data = await getProductionTrendService(req.user, filters);

    return res.status(200).json({
      success: true,
      message: "Production trend fetched successfully",
      data,
    });
  } catch (error) {
    console.error("PRODUCTION TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch production trend" });
  }
};

export const getAchievementTrend = async (req, res) => {
  try {
    const filters = {
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      shiftId: req.query.shiftId,
      plantId: req.query.plantId,
      locationId: req.query.locationId,
      conveyorId: req.query.conveyorId,
    };

    const data = await getAchievementTrendService(req.user, filters);

    return res.status(200).json({
      success: true,
      message: "Achievement trend fetched successfully",
      data,
    });
  } catch (error) {
    console.error("ACHIEVEMENT TREND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch achievement trend" });
  }
};