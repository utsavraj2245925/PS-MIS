import express from "express";
import {
  createProductionEntry,
  getProductionEntries,
  getSingleProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
} from "../controllers/production.controller.js";

const router = express.Router();

router.post("/", createProductionEntry);
router.get("/", getProductionEntries);
router.get("/:id", getSingleProductionEntry);
router.put("/:id", updateProductionEntry);
router.delete("/:id", deleteProductionEntry);

export default router;

