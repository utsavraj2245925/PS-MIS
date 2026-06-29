import express from "express";

import {
  createPlant,
  getPlants,
  updatePlant,
  deletePlant,
} from "../controllers/plants.controller.js";

const router = express.Router();

router.post("/", createPlant);
router.get("/", getPlants);
router.put("/:id", updatePlant);
router.delete("/:id", deletePlant);

export default router;