import express from "express";

import {
  createModel,
  getModels,
  updateModel,
  deleteModel,
  filterModels,
} from "../controllers/modelController.js";

const router = express.Router();

router.post("/models", createModel);

router.get("/models", getModels);

router.put("/models/:id", updateModel);

router.delete("/models/:id", deleteModel);

router.get("/models/filter", filterModels);

export default router;