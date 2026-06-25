import express from "express";

import {
  loginUser,
  logout,
  authenticateMe,
} from "../controllers/authController.js";

import  {isAuthenticated}  from "../Auth/isAuthenticated.js";

const router = express.Router();


// LOGIN

router.post("/login", loginUser);


// GET CURRENT USER

router.get("/me", isAuthenticated, authenticateMe);


// LOGOUT

router.post("/logout", logout);

export default router;