import User from "../models/users.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    
    const { email, password } = req.body;
    // CHECK USER
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Password" });
    }

    // TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // SET COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        plant: user.plant,
      },
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// AUTHENTICATE USER

export const authenticateMe = async (req, res) => {
    try {
      const user = await User.findById( req.user.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });

      }

      return res.status(200).json({
        success: true,
        user,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };


// LOGOUT

export const logout = async (req,res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,secure:process.env.NODE_ENV === "production",sameSite: "strict", });
    return res.status(200).json({
      success: true,
      message:"Logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};