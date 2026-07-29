import * as conveyorStrengthService from "../services/conveyorStrength.service.js";

/* ==========================================================
   CREATE CONVEYOR CONFIGURATION
========================================================== */

export const createConfiguration = async (req, res) => {
    try {

        const configuration =
            await conveyorStrengthService.createConveyorConfiguration(req.body);

        return res.status(201).json({
            success: true,
            message: "Conveyor configuration created successfully.",
            data: configuration,
        });

    } catch (error) {

        console.error("CREATE CONFIGURATION:", error);

        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message,
        });

    }
};

/* ==========================================================
   GET ALL CONFIGURATIONS
========================================================== */

export const getAllConfigurations = async (req, res) => {
    try {

        const configurations =
            await conveyorStrengthService.getAllConfigurations();

        return res.status(200).json({
            success: true,
            total: configurations.length,
            data: configurations,
        });

    } catch (error) {

        console.error("GET CONFIGURATIONS:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });

    }
};
/* ==========================================================
   GET CONFIGURATIONS BY LOCATION
========================================================== */

export const getConfigurationsByLocation = async (req, res) => {

    try {

        const configurations =
            await conveyorStrengthService.getConfigurationsByLocation(
                req.params.locationId
            );

        return res.status(200).json({
            success: true,
            total: configurations.length,
            data: configurations,
        });

    } catch (error) {

        console.error("GET LOCATION CONFIGURATIONS:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });

    }

};
/* ==========================================================
   GET CONFIGURATIONS BY PLANT
========================================================== */

export const getConfigurationsByPlant = async (req, res) => {

    try {

        const configurations =
            await conveyorStrengthService.getConfigurationsByPlant(
                req.params.plantId
            );

        return res.status(200).json({
            success: true,
            total: configurations.length,
            data: configurations,
        });

    } catch (error) {

        console.error("GET PLANT CONFIGURATIONS:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });

    }

};

/* ==========================================================
   GET CONFIGURATIONS BY SHIFT
========================================================== */

export const getConfigurationsByShift = async (req, res) => {

    try {

        const configurations =
            await conveyorStrengthService.getConfigurationsByShift(
                req.params.shiftId
            );

        return res.status(200).json({
            success: true,
            total: configurations.length,
            data: configurations,
        });

    } catch (error) {

        console.error("GET SHIFT CONFIGURATIONS:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });

    }

};

/* ==========================================================
   GET CONFIGURATION BY ID
========================================================== */

export const getConfigurationById = async (req, res) => {
    try {

        const configuration =
            await conveyorStrengthService.getConfigurationById(req.params.id);

        if (!configuration) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: configuration,
        });

    } catch (error) {

        console.error("GET CONFIGURATION:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });

    }
};

/* ==========================================================
   UPDATE CONFIGURATION
========================================================== */

export const updateConfiguration = async (req, res) => {
    try {

        const configuration =
            await conveyorStrengthService.updateConfiguration(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Configuration updated successfully.",
            data: configuration,
        });

    } catch (error) {

        console.error("UPDATE CONFIGURATION:", error);

        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message,
        });

    }
};

// STATUS */
export const toggleConfigurationStatus = async (req, res) => {

    try {

        const configuration =
            await conveyorStrengthService.toggleConfigurationStatus(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: `Configuration ${configuration.status} successfully.`,
            data: configuration,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

/* ==========================================================
   DELETE CONFIGURATION
========================================================== */

export const deleteConfiguration = async (req, res) => {
    try {

        await conveyorStrengthService.deleteConfiguration(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Configuration deleted successfully.",
        });

    } catch (error) {

        console.error("DELETE CONFIGURATION:", error);

        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message,
        });

    }
};