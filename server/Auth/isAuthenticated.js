import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      console.log("TOKEN NOT AVAILABLE");
      return res.status(401).json({ success: false, message: "Unauthorized User" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.log("ERR IN AUTHENTICATION:", error.message);
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};