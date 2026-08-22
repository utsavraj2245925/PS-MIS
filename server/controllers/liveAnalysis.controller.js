import * as liveAnalysisService from "../services/liveAnalysis.service.js";

/* =========================================================
   GET LIVE ANALYSIS
========================================================= */

export const getLiveAnalysis = async (req, res) => {
  console.log("LIVE ANALYSIS QUERY:", req.query);

  try {
    const { date } = req.query;

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    console.log("LIVE ANALYSIS AUTH USER:", {
      userId: user._id,
      locationId: user.locationId?._id || user.locationId,
      plantId: user.plantId?._id || user.plantId,
      shiftId: user.shiftId?._id || user.shiftId,
      conveyorId: user.conveyorId,
      conveyorName: user.conveyorName,
    });

    const data = await liveAnalysisService.getLiveAnalysis({
      locationId: user.locationId?._id || user.locationId,
      plantId: user.plantId?._id || user.plantId,
      shiftId: user.shiftId?._id || user.shiftId,
      conveyorId: user.conveyorId,
      date,
      now: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Live analysis fetched successfully",
      data,
    });

  } catch (error) {
    console.error("GET LIVE ANALYSIS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to fetch live analysis",
    });
  }
};

/* =========================================================
   GET LIVE ANALYSIS FOR REQUEST
========================================================= */

export const getLiveAnalysisForRequest = async (req, res) => {
  try {
    const data = await liveAnalysisService.getLiveAnalysisForRequest(req);

    return res.status(200).json({ success: true, message: "Live analysis fetched successfully", data });
  } catch (error) {
    console.error("GET LIVE ANALYSIS REQUEST ERROR:", error);

    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch live analysis" });
  }
};

/* =========================================================
   GET CURRENT MODEL ANALYSIS
========================================================= */

export const getCurrentModelAnalysis = async (req, res) => {
  try {
    const { plantId, shiftId, conveyorId, date } = req.query;

    const data = await liveAnalysisService.getCurrentModelAnalysis({ plantId, shiftId, conveyorId, date });

    return res.status(200).json({ success: true, message: "Current model analysis fetched successfully", data });
  } catch (error) {
    console.error("GET CURRENT MODEL ANALYSIS ERROR:", error);

    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch current model analysis" });
  }
};

/* =========================================================
   GET CURRENT BLOCK ANALYSIS
========================================================= */

export const getCurrentBlockAnalysis = async (req, res) => {
  try {
    const { locationId, plantId, shiftId, conveyorId, date } = req.query;

    const data = await liveAnalysisService.getCurrentBlockAnalysis({ locationId, plantId, shiftId, conveyorId, date });

    return res.status(200).json({ success: true, message: "Current block analysis fetched successfully", data });
  } catch (error) {
    console.error("GET CURRENT BLOCK ANALYSIS ERROR:", error);

    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch current block analysis" });
  }
};