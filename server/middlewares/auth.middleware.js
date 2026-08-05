import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

export const verifyToken = async (
  req,
  res,
  next
) => {
  try {

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(decoded.id)
        .populate("locationId")
        .populate("plantId")
        .populate("shiftId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    console.log("AUTH USER =", {
      role: user.role,
      locationId: user.locationId?._id,
      plantId: user.plantId?._id,
      shiftId: user.shiftId?._id,
    });

    next();

  } catch (error) {

    console.log(
      "VERIFY TOKEN ERROR =",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};