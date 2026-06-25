import express from "express";

import {
  createPlant,
  getPlants,
  updatePlant,
  deletePlant,
} from "../controllers/plantController.js";

const router = express.Router();

// CREATE PLANT
router.post("/plants", createPlant);

// GET ALL PLANTS
router.get("/plants", getPlants);

// UPDATE PLANT
router.put("/plants/:id", updatePlant);

// DELETE PLANT
router.delete("/plants/:id", deletePlant);

export default router;