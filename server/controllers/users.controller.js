import bcrypt from "bcryptjs";

import User from "../models/users.model.js";
import Plant from "../models/plants.model.js";

// ==============================================
// CREATE USER
// ==============================================

export const createUser = async (req, res) => {
  try {
    const {name,mail,assword,ole,ocation,lantId,tatus } = req.body;
    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !name ||
      !email ||
      !password ||
      !role) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, Employee ID, Password & Role are required" });
    }

    // ==========================================
    // CHECK EMAIL
    // ==========================================

    const existingEmail = await User.findOne({email});

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // ==========================================
    // VALIDATE PLANT
    // ==========================================

    let plantData = null;
    if (plantId) {
      plantData = await Plant.findById(
        plantId
      );
      if (!plantData) {
        return res.status(404).json({
          success: false,
          message: "Plant not found",
        });
      }
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // ==========================================
    // CREATE USER
    // ==========================================
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      location,
      plantId: plantData?._id || null,
      plant: plantData?.plantName || "",

      status: status || "Active",
    });
    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message:
        "User created successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================================
// GET ALL USERS
// ==============================================

export const getUsers = async ( req, res) => {
  try {
    const users = await User.find()
      .populate("plantId", "plantName plantCode location")
      .sort({createdAt: -1})
      .select("-password")
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================================
// GET SINGLE USER
// ==============================================
export const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

      .populate("plantId", "plantName plantCode location")
      .select("-password");

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
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================================
// UPDATE USER
// ==============================================

export const updateUser = async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id );
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = { ...req.body };

    // ==========================================
    // UPDATE PASSWORD
    // ==========================================

    if (req.body.password) { updateData.password = await bcrypt.hash( req.body.password, 10);
    }

    // ==========================================
    // UPDATE PLANT DETAILS
    // ==========================================

    if (req.body.plantId) {
      const plant = await Plant.findById( req.body.plantId );

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: "Plant not found" });
      }

      updateData.plant = plant.plantName;
    }

    // ==========================================
    // UPDATE USER
    // ==========================================

    const updatedUser =
      await User.findByIdAndUpdate( req.params.id,updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("plantId", "plantName plantCode location")
        .select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================================
// DELETE USER
// ==============================================

export const deleteUser = async ( req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "User deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================================
// GET USERS BY PLANT
// ==============================================

export const getUsersByPlant =
  async (req, res) => {
    try {
      const users = await User.find({
        plantId: req.params.plantId,
      })

        .select("-password")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// ==============================================
// GET USERS BY ROLE
// ==============================================

export const getUsersByRole =
  async (req, res) => {
    try {
      const users = await User.find({
        role: req.params.role,
      })
        .select("-password")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };