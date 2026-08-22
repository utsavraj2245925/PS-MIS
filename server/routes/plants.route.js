import express from "express";

import {
  createPlant,
  updatePlant,
  deletePlant,
  permanentDeletePlant,
  getPlants,
  getPlantById,
  getPlantsByLocation,
} from "../controllers/plants.controller.js";

const router = express.Router();

console.log(">>> PLANTS ROUTE LOADED <<<");

/* ==========================================================
   CREATE PLANT
========================================================== */

router.post("/", createPlant);

/* ==========================================================
   GET ALL PLANTS
========================================================== */

router.get("/", getPlants);

/* ==========================================================
   GET PLANTS BY LOCATION
========================================================== */

router.get("/location/:locationId", getPlantsByLocation);

/* ==========================================================
   GET SINGLE PLANT
========================================================== */

router.get("/:id", getPlantById);

/* ==========================================================
   UPDATE PLANT
========================================================== */

router.put("/:id", updatePlant);

/* ==========================================================
   DEACTIVATE PLANT (soft delete — status -> Inactive)
========================================================== */

router.delete("/:id", deletePlant);

/* ==========================================================
   PERMANENTLY DELETE PLANT (hard delete)
========================================================== */

router.delete("/:id/permanent", permanentDeletePlant);

export default router;