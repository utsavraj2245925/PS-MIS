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