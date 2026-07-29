import Location from "../models/location.model.js"; // ⚠ VERIFY: import path
import Plant from "../models/plants.model.js";
import Shift from "../models/shift.model.js";
import ConveyorStrength from "../models/conveyorStrength.model.js";

import { calculateConveyorMetrics } from "./conveyorCalculation.service.js";

/* ==========================================================
   CREATE CONVEYOR CONFIGURATION
========================================================== */

export const createConveyorConfiguration = async (data) => {

    const {

        locationId,
        plantId,
        conveyorId,
        shiftId,

        conveyorLength,
        conveyorSpeed,
        pitchDistance,

        demandPerShift,
        hangerEfficiency,
        status,

    } = data;

    /* -----------------------------
       Validation
    ------------------------------ */

    if (!locationId || !plantId || !conveyorId || !shiftId) {
        const error = new Error("Location, Plant, Conveyor and Shift are required.");
        error.statusCode = 400;
        throw error;
    }

    /* -----------------------------
       Location
    ------------------------------ */

    const location = await Location.findById(locationId);

    if (!location) {
        const error = new Error("Location not found.");
        error.statusCode = 404;
        throw error;
    }

    /* -----------------------------
       Plant
    ------------------------------ */

    const plant = await Plant.findById(plantId);

    if (!plant) {
        const error = new Error("Plant not found.");
        error.statusCode = 404;
        throw error;
    }

    // Plant must belong to the selected Location
    if (plant.locationId?.toString() !== location._id.toString()) {
        const error = new Error("Selected Plant does not belong to the selected Location.");
        error.statusCode = 400;
        throw error;
    }

    /* -----------------------------
       Conveyor
    ------------------------------ */

    const conveyor = plant.conveyors.id(conveyorId);

    if (!conveyor) {
        const error = new Error("Conveyor not found.");
        error.statusCode = 404;
        throw error;
    }

    /* -----------------------------
       Shift
    ------------------------------ */

    const shift = await Shift.findById(shiftId);

    if (!shift) {
        const error = new Error("Shift not found.");
        error.statusCode = 404;
        throw error;
    }

    // Shift must belong to the selected Plant
    if (shift.plantId?.toString() !== plant._id.toString()) {
        const error = new Error("Selected Shift does not belong to the selected Plant.");
        error.statusCode = 400;
        throw error;
    }

    /* -----------------------------
       Duplicate
       (matches the unique index: locationId + plantId + shiftId + conveyorId)
    ------------------------------ */

    const alreadyExists = await ConveyorStrength.findOne({
        locationId,
        plantId,
        conveyorId,
        shiftId,
    });

    if (alreadyExists) {
        const error = new Error(
            "This conveyor is already configured for the selected shift."
        );
        error.statusCode = 409;
        throw error;
    }

    /* -----------------------------
       Working Time
    ------------------------------ */

    const availableTime = shift.actualWorkingMinutes;

    /* -----------------------------
       Engineering Calculation
    ------------------------------ */

    const calculations = calculateConveyorMetrics({

        conveyorLength,
        conveyorSpeed,
        pitchDistance,
        availableTime,
        hangerEfficiency,
        demandPerShift,

    });

    /* -----------------------------
       Save
    ------------------------------ */

    const configuration = await ConveyorStrength.create({

        locationId,
        plantId,
        conveyorId,
        shiftId,

        locationName: location.locationName, // ⚠ VERIFY: Location field name
        plantName: plant.plantName,
        conveyorName: conveyor.conveyorName,
        shiftName: shift.shiftName,

        availableTime,

        conveyorLength,
        conveyorSpeed,
        pitchDistance,

        demandPerShift,
        hangerEfficiency,

        status: status || "Active",

        ...calculations,

    });

    return configuration;

};

/* ==========================================================
   GET ALL
========================================================== */

export const getAllConfigurations = async () => {

    return await ConveyorStrength
        .find()
        .sort({ createdAt: -1 });

};

/* ==========================================================
   GET BY LOCATION
========================================================== */

export const getConfigurationsByLocation = async (locationId) => {

    return await ConveyorStrength
        .find({ locationId })
        .sort({ createdAt: -1 });

};

/* ==========================================================
   GET BY PLANT
========================================================== */

export const getConfigurationsByPlant = async (plantId) => {

    return await ConveyorStrength
        .find({ plantId })
        .sort({ createdAt: -1 });

};

/* ==========================================================
   GET BY SHIFT
========================================================== */

export const getConfigurationsByShift = async (shiftId) => {

    return await ConveyorStrength
        .find({ shiftId })
        .sort({ createdAt: -1 });

};

/* ==========================================================
   GET SINGLE
========================================================== */

export const getConfigurationById = async (id) => {

    return await ConveyorStrength.findById(id);

};

/* ==========================================================
   UPDATE CONFIGURATION
========================================================== */

export const updateConfiguration = async (id, body) => {

    const configuration = await ConveyorStrength.findById(id);

    if (!configuration) {
        const error = new Error("Configuration not found.");
        error.statusCode = 404;
        throw error;
    }

    const { locationId, plantId, conveyorId, shiftId } = body;

    if (!locationId || !plantId || !conveyorId || !shiftId) {
        const error = new Error("Location, Plant, Conveyor and Shift are required.");
        error.statusCode = 400;
        throw error;
    }

    /* -----------------------------
       Duplicate Check
       (matches the unique index: locationId + plantId + shiftId + conveyorId)
    ------------------------------ */

    const duplicate = await ConveyorStrength.findOne({

        _id: { $ne: id },

        locationId,
        plantId,
        conveyorId,
        shiftId,

    });

    if (duplicate) {
        const error = new Error(
            "Configuration already exists for this Plant + Conveyor + Shift."
        );
        error.statusCode = 409;
        throw error;
    }

    /* -----------------------------
       Location
    ------------------------------ */

    const location = await Location.findById(locationId);

    if (!location) {
        const error = new Error("Location not found.");
        error.statusCode = 404;
        throw error;
    }

    /* -----------------------------
       Plant
    ------------------------------ */

    const plant = await Plant.findById(plantId);

    if (!plant) {
        const error = new Error("Plant not found.");
        error.statusCode = 404;
        throw error;
    }

    if (plant.locationId?.toString() !== location._id.toString()) {
        const error = new Error("Selected Plant does not belong to the selected Location.");
        error.statusCode = 400;
        throw error;
    }

    /* -----------------------------
       Conveyor
    ------------------------------ */

    const conveyor = plant.conveyors.id(conveyorId);

    if (!conveyor) {
        const error = new Error("Conveyor not found.");
        error.statusCode = 404;
        throw error;
    }

    /* -----------------------------
       Shift
    ------------------------------ */

    const shift = await Shift.findById(shiftId);

    if (!shift) {
        const error = new Error("Shift not found.");
        error.statusCode = 404;
        throw error;
    }

    if (shift.plantId?.toString() !== plant._id.toString()) {
        const error = new Error("Selected Shift does not belong to the selected Plant.");
        error.statusCode = 400;
        throw error;
    }

    const availableTime = shift.actualWorkingMinutes;

    /* -----------------------------
       Recalculate
    ------------------------------ */

    const calculations = calculateConveyorMetrics({

        conveyorLength: body.conveyorLength,

        conveyorSpeed: body.conveyorSpeed,

        pitchDistance: body.pitchDistance,

        availableTime,

        hangerEfficiency: body.hangerEfficiency,

        demandPerShift: body.demandPerShift,

    });

    /* -----------------------------
       Update
    ------------------------------ */

    configuration.locationId = locationId;

    configuration.plantId = plantId;

    configuration.conveyorId = conveyorId;

    configuration.shiftId = shiftId;

    configuration.locationName = location.locationName; // ⚠ VERIFY: Location field name

    configuration.plantName = plant.plantName;

    configuration.conveyorName = conveyor.conveyorName;

    configuration.shiftName = shift.shiftName;

    configuration.availableTime = availableTime;

    configuration.conveyorLength = body.conveyorLength;

    configuration.conveyorSpeed = body.conveyorSpeed;

    configuration.pitchDistance = body.pitchDistance;

    configuration.demandPerShift = body.demandPerShift;

    configuration.hangerEfficiency = body.hangerEfficiency;

    configuration.status = body.status;

    Object.assign(configuration, calculations);

    await configuration.save();

    return configuration;

};

/* ==========================================================
   DELETE
========================================================== */

export const deleteConfiguration = async (id) => {

    const configuration = await ConveyorStrength.findById(id);

    if (!configuration) {
        const error = new Error("Configuration not found.");
        error.statusCode = 404;
        throw error;
    }

    await configuration.deleteOne();

    return true;

};
export const toggleConfigurationStatus = async (id) => {

    const configuration = await ConveyorStrength.findById(id);

    if (!configuration) {
        throw new Error("Configuration not found.");
    }

    configuration.status =
        configuration.status === "Active"
            ? "Inactive"
            : "Active";

    await configuration.save();

    return configuration;
};