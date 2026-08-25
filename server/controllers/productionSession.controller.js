import * as productionSessionService from "../services/productionSession.service.js";

/* ============================================================
   START PRODUCTION SESSION
============================================================ */

export const startProductionSession = async (req, res) => {
  try {
    const session = await productionSessionService.startProductionSession({ ...req.body, userId: req.user?.id || req.user?._id });

    return res.status(201).json({ success: true, message: "Production session started successfully", data: session });
  } catch (error) {
    console.error("START PRODUCTION SESSION ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to start production session" });
  }
};

/* ============================================================
   UPDATE SESSION PART QUANTITIES
============================================================ */

export const updateSessionParts = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await productionSessionService.updateProductionSessionParts({
      sessionId,
      parts: req.body.parts,
    });

    return res.status(200).json({ success: true, message: "Session part quantities updated successfully", data: session });
  } catch (error) {
    console.error("UPDATE SESSION PARTS ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to update session parts" });
  }
};

/* ============================================================
   UPDATE SESSION DOWNTIME
============================================================ */

export const updateSessionDowntime = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await productionSessionService.updateProductionSessionDowntime({
      sessionId,
      downtimes: req.body.downtimes,
    });

    return res.status(200).json({ success: true, message: "Session downtime updated successfully", data: session });
  } catch (error) {
    console.error("UPDATE SESSION DOWNTIME ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to update session downtime" });
  }
};

/* ============================================================
   GET LIVE SESSION
============================================================ */

export const getLiveProductionSession = async (req, res) => {
  try {
    const session = await productionSessionService.getLiveProductionSession(req.query);

    return res.status(200).json({ success: true, message: "Live production session fetched successfully", data: session });
  } catch (error) {
    console.error("GET LIVE PRODUCTION SESSION ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to fetch live production session" });
  }
};

/* ============================================================
   GET SESSION BY ID
============================================================ */

export const getProductionSessionById = async (req, res) => {
  try {
    const session = await productionSessionService.getProductionSessionById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Production session not found" });
    }

    return res.status(200).json({ success: true, message: "Production session fetched successfully", data: session });
  } catch (error) {
    console.error("GET PRODUCTION SESSION BY ID ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to fetch production session" });
  }
};

/* ============================================================
   COMPLETE PRODUCTION SESSION
============================================================ */

export const completeProductionSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await productionSessionService.completeProductionSession({
      sessionId,
      parts: req.body.parts,
      endTime: req.body.endTime,
    });

    return res.status(200).json({ success: true, message: "Production session completed successfully", data: session });
  } catch (error) {
    console.error("COMPLETE PRODUCTION SESSION ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to complete production session" });
  }
};

/* ============================================================
   CANCEL PRODUCTION SESSION
============================================================ */

export const cancelProductionSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await productionSessionService.cancelProductionSession({
      sessionId,
      reason: req.body.reason,
    });

    return res.status(200).json({ success: true, message: "Production session cancelled successfully", data: session });
  } catch (error) {
    console.error("CANCEL PRODUCTION SESSION ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to cancel production session" });
  }
};

/* ============================================================
   GET SESSION HISTORY
============================================================ */

export const getProductionSessionHistory = async (req, res) => {
  try {
    const result = await productionSessionService.getProductionSessionHistory(req.query);

    return res.status(200).json({ success: true, message: "Production session history fetched successfully", data: result });
  } catch (error) {
    console.error("GET PRODUCTION SESSION HISTORY ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to fetch production session history" });
  }
};

/* ============================================================
   GET SESSION PERFORMANCE
============================================================ */

export const getProductionSessionPerformance = async (req, res) => {
  try {
    const result = await productionSessionService.getProductionSessionPerformance(req.params.id);

    return res.status(200).json({ success: true, message: "Production session performance fetched successfully", data: result });
  } catch (error) {
    console.error("GET PRODUCTION SESSION PERFORMANCE ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to fetch production session performance" });
  }
};

/* ============================================================
   GET LIVE SESSION SNAPSHOT
============================================================ */

export const getProductionSessionSnapshot = async (req, res) => {
  try {
    const result = await productionSessionService.getProductionSessionSnapshot(req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: "Production session not found" });
    }

    return res.status(200).json({ success: true, message: "Production session snapshot fetched successfully", data: result });
  } catch (error) {
    console.error("GET PRODUCTION SESSION SNAPSHOT ERROR:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to fetch production session snapshot" });
  }
};