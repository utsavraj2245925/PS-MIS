import express from "express";
import { isAuthenticated } from "../Auth/isAuthenticated.js";
import { startProductionSession, updateSessionParts, updateSessionDowntime, getLiveProductionSession, getProductionSessionById, completeProductionSession, cancelProductionSession, getProductionSessionHistory, getProductionSessionPerformance, getProductionSessionSnapshot } from "../controllers/productionSession.controller.js";

const router = express.Router();
router.use(isAuthenticated);

/* =========================================================
   START PRODUCTION SESSION
   POST /api/production-sessions/start
========================================================= */

router.post("/start", startProductionSession);

/* =========================================================
   GET LIVE PRODUCTION SESSION
   GET /api/production-sessions/live
========================================================= */

router.get("/live", getLiveProductionSession);

/* =========================================================
   GET SESSION HISTORY
   GET /api/production-sessions/history
========================================================= */

router.get("/history", getProductionSessionHistory);

/* =========================================================
   GET SESSION BY ID
   GET /api/production-sessions/:id
========================================================= */

router.get("/:id", getProductionSessionById);

/* =========================================================
   GET SESSION PERFORMANCE
   GET /api/production-sessions/:id/performance
========================================================= */

router.get("/:id/performance", getProductionSessionPerformance);

/* =========================================================
   GET LIVE SESSION SNAPSHOT
   GET /api/production-sessions/:id/snapshot
========================================================= */

router.get("/:id/snapshot", getProductionSessionSnapshot);

/* =========================================================
   UPDATE SESSION PART QUANTITIES
   PUT /api/production-sessions/:id/parts
========================================================= */

router.put("/:id/parts", updateSessionParts);

/* =========================================================
   UPDATE SESSION DOWNTIME
   PUT /api/production-sessions/:id/downtime
========================================================= */

router.put("/:id/downtime", updateSessionDowntime);

/* =========================================================
   COMPLETE PRODUCTION SESSION
   PUT /api/production-sessions/:id/complete
========================================================= */

router.put("/:id/complete", completeProductionSession);

/* =========================================================
   CANCEL PRODUCTION SESSION
   PUT /api/production-sessions/:id/cancel
========================================================= */

router.put("/:id/cancel", cancelProductionSession);


export default router;