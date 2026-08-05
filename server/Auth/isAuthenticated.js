import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      console.log("TOKEN NOT AVAILABLE");
      return res.status(401).json({ success: false, message: "Unauthorized User" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load FULL user from DB (with locationId, plantId, shiftId)
    const user = await User.findById(decoded.id)
      .populate("locationId")
      .populate("plantId")
      .populate("shiftId");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.log("ERR IN AUTHENTICATION:", error.message);
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};