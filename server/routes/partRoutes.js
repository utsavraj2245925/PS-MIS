import express from "express";

import {
  createPart,
  getParts,
  updatePart,
  deletePart,
  getFilterParts,
} from "../controllers/partController.js";

const router = express.Router();

router.post("/parts", createPart);


router.get("/parts", getParts);
// localhost:4000/api/parts

router.get("/parts/filter", getFilterParts);

router.put("/parts/:id", updatePart);

router.delete("/parts/:id", deletePart);






export default router;