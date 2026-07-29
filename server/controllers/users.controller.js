import bcrypt from "bcryptjs";

import User from "../models/users.model.js";
import Location from "../models/location.model.js"; // ⚠ VERIFY: guessed to match your plural naming convention
import Plant from "../models/plants.model.js"; // confirmed — matches your conveyorStrength.service.js
import Shift from "../models/shift.model.js"; // confirmed — matches your conveyorStrength.service.js

/* ================================================================
   ⚠ ASSUMPTIONS — VERIFY AGAINST YOUR ACTUAL PROJECT
   ----------------------------------------------------------------
   1. Model import paths: your User/Plant/Shift files follow a
      "users.model.js" / "plants.model.js" / "shift.model.js"
      naming convention (confirmed from files you've shared). The
      Location file path is guessed as "locations.model.js" to
      match that same plural pattern — rename the import above if
      yours is actually "location.model.js".
   2. Plant  -> { _id, plantName, locationId, conveyors: [{ _id, conveyorName, status }] }
   3. Shift  -> { _id, shiftName, plantId }
   4. Location -> { _id, locationName, status }
   5. req.user is populated by isAuthenticated, which sets
      req.user = decoded (the raw JWT payload, not a Mongoose doc).
      createdBy/updatedBy read req.user?._id, falling back to
      req.user?.id in case your token was signed with "id" instead
      of "_id" — verify which key your login route signs into the
      JWT and drop the one that doesn't apply.
================================================================ */

const SALT_ROUNDS = 10;
const PLANT_CONVEYOR_KEY = "conveyors";

/* ================================================================
   RESPONSE HELPERS
   ----------------------------------------------------------------
   Success -> { success: true, message, data }
   Failure -> { success: false, message }   (no "data" key)
================================================================ */
const sendSuccess = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

/* ================================================================
   HELPER: validate the full Location → Plant → Shift → Conveyor
   chain and return the snapshot fields to store on the User.

   Throws { statusCode, message } on any failure.
================================================================ */
const validateHierarchyAndBuildSnapshot = async ({ locationId, plantId, shiftId, conveyorId }) => {

    /* ---------- LOCATION ---------- */
    const location = await Location.findById(locationId);
    if (!location) {
        throw { statusCode: 404, message: "Selected Location does not exist." };
    }

    /* ---------- PLANT (must belong to Location) ---------- */
    const plant = await Plant.findById(plantId);
    if (!plant) {
        throw { statusCode: 404, message: "Selected Plant does not exist." };
    }

    if (plant.locationId?.toString() !== location._id.toString()) {
        throw { statusCode: 400, message: "Selected Plant does not belong to the selected Location." };
    }

    /* ---------- SHIFT (must belong to Plant) ---------- */
    const shift = await Shift.findById(shiftId);
    if (!shift) {
        throw { statusCode: 404, message: "Selected Shift does not exist." };
    }

    if (shift.plantId?.toString() !== plant._id.toString()) {
        throw { statusCode: 400, message: "Selected Shift does not belong to the selected Plant." };
    }

    /* ---------- CONVEYOR (embedded inside Plant) ---------- */
    const conveyorList = plant[PLANT_CONVEYOR_KEY] || [];
    const conveyor = conveyorList.id
        ? conveyorList.id(conveyorId)
        : conveyorList.find((c) => c._id.toString() === conveyorId?.toString());

    if (!conveyor) {
        throw { statusCode: 404, message: "Selected Conveyor does not exist inside the selected Plant." };
    }

    return {
        locationId: location._id,
        locationName: location.locationName,
        plantId: plant._id,
        plantName: plant.plantName,
        shiftId: shift._id,
        shiftName: shift.shiftName,
        conveyorId: conveyor._id,
        conveyorName: conveyor.conveyorName,
    };
};

/* ================================================================
   CREATE USER
   POST /api/users
================================================================ */
export const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            locationId,
            plantId,
            shiftId,
            conveyorId,
            status,
        } = req.body;

        /* ---------- Required-field validation ---------- */
        if (!name || !name.trim()) {
            return sendError(res, 400, "Name is required.");
        }
        if (!email || !email.trim()) {
            return sendError(res, 400, "Email is required.");
        }
        if (!password) {
            return sendError(res, 400, "Password is required.");
        }
        if (!role) {
            return sendError(res, 400, "Role is required.");
        }
        if (!locationId) {
            return sendError(res, 400, "Location is required.");
        }
        if (!plantId) {
            return sendError(res, 400, "Plant is required.");
        }
        if (!shiftId) {
            return sendError(res, 400, "Shift is required.");
        }
        if (!conveyorId) {
            return sendError(res, 400, "Conveyor is required.");
        }
        if (!status) {
            return sendError(res, 400, "Status is required.");
        }

        /* ---------- Email uniqueness ---------- */
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return sendError(res, 409, "A user with this email already exists.");
        }

        /* ---------- Hierarchy validation (Location -> Plant -> Shift -> Conveyor) ---------- */
        let snapshot;
        try {
            snapshot = await validateHierarchyAndBuildSnapshot({ locationId, plantId, shiftId, conveyorId });
        } catch (err) {
            return sendError(res, err.statusCode || 400, err.message || "Invalid hierarchy selection.");
        }

        /* ---------- Password hashing ---------- */
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        /* ---------- Create ---------- */
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            status,
            ...snapshot,
            createdBy: req.user?._id || req.user?.id || null,
            updatedBy: req.user?._id || req.user?.id || null,
        });

        const userToReturn = newUser.toObject();
        delete userToReturn.password;

        return sendSuccess(res, 201, "User created successfully.", userToReturn);
    } catch (error) {
        console.error("createUser error:", error);
        return sendError(res, 500, "Failed to create user.");
    }
};

/* ================================================================
   GET ALL USERS (with search / filter support)
   GET /api/users
   Query params: name, email, role, locationId, plantId, shiftId, status
================================================================ */
export const getUsers = async (req, res) => {
    try {
        const { name, email, role, locationId, plantId, shiftId, status } = req.query;

        const filter = {};

        if (name) {
            filter.name = { $regex: name.trim(), $options: "i" };
        }
        if (email) {
            filter.email = { $regex: email.trim(), $options: "i" };
        }
        if (role) {
            filter.role = role;
        }
        if (locationId) {
            filter.locationId = locationId;
        }
        if (plantId) {
            filter.plantId = plantId;
        }
        if (shiftId) {
            filter.shiftId = shiftId;
        }
        if (status) {
            filter.status = status;
        }

        const users = await User.find(filter)
            .select("-password")
            .populate("locationId", "locationName")
            .populate("plantId", "plantName")
            .populate("shiftId", "shiftName")
            .sort({ createdAt: -1 });

        return sendSuccess(res, 200, "Users fetched successfully.", users);
    } catch (error) {
        console.error("getUsers error:", error);
        return sendError(res, 500, "Failed to fetch users.");
    }
};

/* ================================================================
   GET USER BY ID
   GET /api/users/:id
================================================================ */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select("-password")
            .populate("locationId", "locationName")
            .populate("plantId", "plantName")
            .populate("shiftId", "shiftName");

        if (!user) {
            return sendError(res, 404, "User not found.");
        }

        return sendSuccess(res, 200, "User fetched successfully.", user);
    } catch (error) {
        console.error("getUserById error:", error);
        return sendError(res, 500, "Failed to fetch user.");
    }
};

/* ================================================================
   UPDATE USER
   PUT /api/users/:id
================================================================ */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            password,
            role,
            locationId,
            plantId,
            shiftId,
            conveyorId,
            status,
        } = req.body;

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return sendError(res, 404, "User not found.");
        }

        /* ---------- Required-field validation ---------- */
        if (!name || !name.trim()) {
            return sendError(res, 400, "Name is required.");
        }
        if (!email || !email.trim()) {
            return sendError(res, 400, "Email is required.");
        }
        if (!role) {
            return sendError(res, 400, "Role is required.");
        }
        if (!locationId) {
            return sendError(res, 400, "Location is required.");
        }
        if (!plantId) {
            return sendError(res, 400, "Plant is required.");
        }
        if (!shiftId) {
            return sendError(res, 400, "Shift is required.");
        }
        if (!conveyorId) {
            return sendError(res, 400, "Conveyor is required.");
        }
        if (!status) {
            return sendError(res, 400, "Status is required.");
        }

        /* ---------- Email uniqueness (excluding self) ---------- */
        const normalizedEmail = email.toLowerCase().trim();
        if (normalizedEmail !== existingUser.email) {
            const emailTaken = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
            if (emailTaken) {
                return sendError(res, 409, "A user with this email already exists.");
            }
        }

        /* ---------- Hierarchy validation — always re-validated, never trusted from frontend ---------- */
        let snapshot;
        try {
            snapshot = await validateHierarchyAndBuildSnapshot({ locationId, plantId, shiftId, conveyorId });
        } catch (err) {
            return sendError(res, err.statusCode || 400, err.message || "Invalid hierarchy selection.");
        }

        /* ---------- Build update payload ---------- */
        const updateFields = {
            name: name.trim(),
            email: normalizedEmail,
            role,
            status,
            ...snapshot,
            updatedBy: req.user?._id || req.user?.id || null,
        };

        if (password) {
            updateFields.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
            new: true,
            runValidators: true,
        })
            .select("-password")
            .populate("locationId", "locationName")
            .populate("plantId", "plantName")
            .populate("shiftId", "shiftName");

        return sendSuccess(res, 200, "User updated successfully.", updatedUser);
    } catch (error) {
        console.error("updateUser error:", error);
        return sendError(res, 500, "Failed to update user.");
    }
};

/* ================================================================
   DELETE USER (hard delete)
   DELETE /api/users/:id
================================================================ */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return sendError(res, 404, "User not found.");
        }

        return sendSuccess(res, 200, "User deleted permanently.", null);
    } catch (error) {
        console.error("deleteUser error:", error);
        return sendError(res, 500, "Failed to delete user.");
    }
};

/* ================================================================
   TOGGLE USER STATUS (Active / Inactive)
   PATCH /api/users/:id/status
   Body: { status: "Active" | "Inactive" }
================================================================ */
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["Active", "Inactive"].includes(status)) {
            return sendError(res, 400, "Status must be either 'Active' or 'Inactive'.");
        }

        const user = await User.findById(id);
        if (!user) {
            return sendError(res, 404, "User not found.");
        }

        user.status = status;
        user.updatedBy = req.user?._id || req.user?.id || null;
        await user.save();

        const userToReturn = user.toObject();
        delete userToReturn.password;

        return sendSuccess(res, 200, `User status updated to ${status}.`, userToReturn);
    } catch (error) {
        console.error("toggleUserStatus error:", error);
        return sendError(res, 500, "Failed to update user status.");
    }
};