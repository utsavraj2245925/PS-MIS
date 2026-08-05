import Plant from "../models/plants.model.js";
import Location from "../models/location.model.js";
import Shift from "../models/shift.model.js";
import { dashboardSummaryService }
from "../services/dashboard.service.js";

export const getDashboardSummary =
  async (req, res) => {
    try {

      const filters = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        shiftId: req.query.shiftId,
        plantId: req.query.plantId,
        locationId: req.query.locationId,
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

    // SUPER ADMIN — sees All Locations, All Plants, All Shifts
    if (user.role === "superAdmin") {

      locations = await Location.find({ status: "Active" })
        .select("_id locationName")
        .lean();

      plants = await Plant.find({ status: "Active" })
        .select("_id plantName locationId")
        .lean();

      shifts = await Shift.find({ status: "Active" })
        .select("_id shiftName plantId")
        .lean();
    }

    // PLANT ADMIN — pinned to Own Location; sees All Plants under it,
    // and All Shifts under those plants. (plantAdmin's own `plantId` is
    // null in the DB — the previous version queried Plant.find({_id: null})
    // which always returned empty, that's why plants/shifts were blank.)
    else if (user.role === "plantAdmin") {

      if (userLocationId) {
        plants = await Plant.find({ locationId: userLocationId, status: "Active" })
          .select("_id plantName locationId")
          .lean();

        const plantIds = plants.map((p) => p._id);

        shifts = await Shift.find({ plantId: { $in: plantIds }, status: "Active" })
          .select("_id shiftName plantId")
          .lean();
      }
    }

    // MANAGER — pinned to Own Plant; sees All Shifts of that plant.
    // (manager's own `shiftId` is null — the previous version queried
    // Shift.find({_id: null}) which always returned empty.)
    else if (user.role === "manager") {

      if (userPlantId) {
        shifts = await Shift.find({ plantId: userPlantId, status: "Active" })
          .select("_id shiftName plantId")
          .lean();
      }
    }

    // USER — no filters at all; arrays stay empty.

    return res.status(200).json({
      success: true,
      data: {
        locations,
        plants,
        shifts,
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