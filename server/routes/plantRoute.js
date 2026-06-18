import express from "express";

import {
  createPlant,
  getPlants,
  updatePlant,
  deletePlant,
} from "../controllers/plantController.js";

const router = express.Router();

router.post("/plants", createPlant);

router.get("/plants", getPlants);

router.put("/plants/:id", updatePlant);

router.delete("/plants/:id", deletePlant);

export default router;