import express from "express";
import {
  createProductionEntry,
  getproductions,
  getSingleProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
} from "../controllers/production.controller.js";
import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();

router.use(isAuthenticated);

router.post("/", createProductionEntry);
router.get("/", getproductions);
router.get("/:id", getSingleProductionEntry);
router.put("/:id", updateProductionEntry);
router.delete("/:id", deleteProductionEntry);

export default router;
