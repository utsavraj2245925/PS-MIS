import * as liveAnalysisService from "../services/liveAnalysis.service.js";

/* =========================================================
   GET LIVE ANALYSIS
========================================================= */

export const getLiveAnalysis = async (req, res) => {
  console.log("LIVE ANALYSIS QUERY:", req.query);

  try {
    const { date } = req.query;
    const scope = await liveAnalysisService.resolveRoleAwareLiveScope(req.user, req.query);

    const data = await liveAnalysisService.getLiveAnalysis({
      ...scope,
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
    const scope = await liveAnalysisService.resolveRoleAwareLiveScope(req.user, req.query);
    const data = await liveAnalysisService.getLiveAnalysisForRequest({
      scope,
      date: req.query.date,
      now: new Date(),
    });

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
    const scope = await liveAnalysisService.resolveRoleAwareLiveScope(req.user, req.query);
    const { date } = req.query;

    const data = await liveAnalysisService.getCurrentModelAnalysis({ ...scope, date });

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
    const scope = await liveAnalysisService.resolveRoleAwareLiveScope(req.user, req.query);

    const data = await liveAnalysisService.getCurrentBlockAnalysis(scope);

    return res.status(200).json({ success: true, message: "Current block analysis fetched successfully", data });
  } catch (error) {
    console.error("GET CURRENT BLOCK ANALYSIS ERROR:", error);

    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch current block analysis" });
  }
};
