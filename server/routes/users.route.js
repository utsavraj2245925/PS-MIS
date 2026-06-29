import express from "express";

import {
  createUser,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getUsersByPlant,
  getUsersByRole,
} from "../controllers/users.controller.js";

const router = express.Router();

// CREATE USER
router.post("/", createUser);

// GET ALL USERS
router.get("/", getUsers);

// EXTRA FILTERS
router.get("/plant/:plantId", getUsersByPlant);
router.get("/role/:role", getUsersByRole);

// GET SINGLE USER
router.get("/:id", getSingleUser);

// UPDATE USER
router.put("/:id", updateUser);

// DELETE USER
router.delete("/:id", deleteUser);

export default router;