import express from "express";

import {
  getLiveAnalysis,
  getLiveAnalysisForRequest,
  getCurrentModelAnalysis,
  getCurrentBlockAnalysis,
} from "../controllers/liveAnalysis.controller.js";

import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();

/* =========================================================
   LIVE ANALYSIS
========================================================= */

router.get("/", isAuthenticated, getLiveAnalysis);

/* =========================================================
   LIVE ANALYSIS WITH FILTERS
========================================================= */

router.get(
  "/request",
  isAuthenticated,
  getLiveAnalysisForRequest
);

/* =========================================================
   CURRENT MODEL
========================================================= */

router.get(
  "/current-model",
  isAuthenticated,
  getCurrentModelAnalysis
);

/* =========================================================
   CURRENT TIME BLOCK
========================================================= */

router.get(
  "/current-block",
  isAuthenticated,
  getCurrentBlockAnalysis
);

export default router;