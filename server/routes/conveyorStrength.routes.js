import express from "express";

import {
    createConfiguration,
    getAllConfigurations,
    getConfigurationById,
    updateConfiguration,
    toggleConfigurationStatus,
    deleteConfiguration,
    getConfigurationsByLocation,
    getConfigurationsByPlant,
    getConfigurationsByShift,
} from "../controllers/conveyorStrength.controller.js";

const router = express.Router();

/* ==========================================================
   CREATE
========================================================== */

router.post("/", createConfiguration);

/* ==========================================================
   GET ALL
========================================================== */

router.get("/", getAllConfigurations);

/* ==========================================================
   LOCATION
========================================================== */

router.get(
    "/location/:locationId",
    getConfigurationsByLocation
);

/* ==========================================================
   PLANT
========================================================== */

router.get(
    "/plant/:plantId",
    getConfigurationsByPlant
);

/* ==========================================================
   SHIFT
========================================================== */

router.get(
    "/shift/:shiftId",
    getConfigurationsByShift
);

/* ==========================================================
   SINGLE
========================================================== */

router.get(
    "/:id",
    getConfigurationById
);

/* ==========================================================
   UPDATE
========================================================== */

router.put(
    "/:id",
    updateConfiguration
);

/* ==========================================================
   TOGGLE STATUS (Active <-> Inactive)
   ⚠ This was already built in your service + controller
   (toggleConfigurationStatus) but had no route pointing to it —
   added here so it's actually reachable.
========================================================== */

router.patch(
    "/:id/toggle-status",
    toggleConfigurationStatus
);

/* ==========================================================
   DELETE
========================================================== */

router.delete(
    "/:id",
    deleteConfiguration
);

export default router;