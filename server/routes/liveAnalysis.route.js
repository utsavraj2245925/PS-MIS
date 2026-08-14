import express from "express";

import {
  getLiveAnalysis,
  getLiveAnalysisForRequest,
  getCurrentModelAnalysis,
  getCurrentBlockAnalysis,
} from "../controllers/liveAnalysis.controller.js";

const router = express.Router();

/* =========================================================
   LIVE ANALYSIS
========================================================= */

router.get("/", getLiveAnalysis);

/* =========================================================
   LIVE ANALYSIS WITH FILTERS
   ?locationId=&plantId=&shiftId=&conveyorId=&date=
========================================================= */

router.get("/request", getLiveAnalysisForRequest);

/* =========================================================
   CURRENT MODEL
========================================================= */

router.get("/current-model", getCurrentModelAnalysis);

/* =========================================================
   CURRENT TIME BLOCK
========================================================= */

router.get("/current-block", getCurrentBlockAnalysis);

export default router;