import express from "express";

import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus,
} from "../controllers/users.controller.js";

import { isAuthenticated } from "../Auth/isAuthenticated.js";

const router = express.Router();

// Protect every user route — the controller relies on req.user (set by
// isAuthenticated from the JWT payload) for createdBy / updatedBy.
router.use(isAuthenticated);

/* ==========================================================
   CREATE
========================================================== */
router.post("/", createUser);

/* ==========================================================
   GET ALL (supports ?name=&email=&role=&locationId=&plantId=&shiftId=&status=)
========================================================== */
router.get("/", getUsers);

/* ==========================================================
   GET SINGLE
========================================================== */
router.get("/:id", getUserById);

/* ==========================================================
   UPDATE
========================================================== */
router.put("/:id", updateUser);

/* ==========================================================
   TOGGLE STATUS (Active / Inactive)
========================================================== */
router.patch("/:id/status", toggleUserStatus);

/* ==========================================================
   DELETE (hard delete)
========================================================== */
router.delete("/:id", deleteUser);

export default router;