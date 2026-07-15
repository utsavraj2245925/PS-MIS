import express from "express";
import {
  createModelPartTarget,
  getModelPartTargets,
  updateModelPartTarget,
  deleteModelPartTarget,
} from "../controllers/modelPartTarget.controller.js";
import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/", createModelPartTarget);
router.get("/", getModelPartTargets);
router.put("/:id", updateModelPartTarget);
router.delete("/:id", deleteModelPartTarget);

export default router;