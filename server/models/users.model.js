import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        /* ==========================
           BASIC DETAILS
        ========================== */

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        /* ==========================
           ROLE
        ========================== */

        role: {
            type: String,
            enum: [
                "superAdmin",
                "plantAdmin",
                "manager",
                "user",
            ],
            default: "user",
        },

        /* ==========================
           LOCATION
           (Manager & Plant Admin)
        ========================== */

        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
            default: null,
        },

        locationName: {
            type: String,
            default: "",
        },

        /* ==========================
           PLANT
           (Manager & User)
        ========================== */

        plantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plant",
            default: null,
        },

        plantName: {
            type: String,
            default: "",
            trim: true,
        },

        /* ==========================
           SHIFT
           (Only User)
        ========================== */

        shiftId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shift",
            default: null,
        },

        shiftName: {
            type: String,
            default: "",
            trim: true,
        },

        /* ==========================
           CONVEYOR
           (Only User)
        ========================== */

        conveyorId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null, // embedded conveyor _id
            required: false,
        },

        conveyorName: {
            type: String,
            default: "",
            trim: true,
        },

        /* ==========================
           STATUS
        ========================== */

        status: {
            type: String,
            enum: [
                "Active",
                "Inactive",
            ],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

/* ==========================
   INDEXES
========================== */

userSchema.index({
    role: 1,
});

userSchema.index({
    locationId: 1,
});

userSchema.index({
    plantId: 1,
});

userSchema.index({
    shiftId: 1,
});

userSchema.index({
    locationId: 1,
    plantId: 1,
    role: 1,
});

export default mongoose.model("User", userSchema);