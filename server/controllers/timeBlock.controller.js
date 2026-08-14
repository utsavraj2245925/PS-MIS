import * as timeBlockService from "../services/timeBlock.service.js";

/* ========================= CREATE CONFIGURATION ========================= */

export const createTimeBlockConfiguration = async (req, res) => {
  try {
    const data = await timeBlockService.createTimeBlockConfiguration(req.body);

    return res.status(201).json({
      success: true,
      message: "Time-block configuration created successfully.",
      data,
    });
  } catch (error) {
    console.error("CREATE TIME-BLOCK CONFIGURATION ERROR:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to create time-block configuration.",
    });
  }
};

/* ========================= GET ALL CONFIGURATIONS ========================= */

export const getAllTimeBlockConfigurations = async (req, res) => {
  try {
    const data = await timeBlockService.getAllTimeBlockConfigurations(req.query);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET TIME-BLOCK CONFIGURATIONS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch time-block configurations.",
    });
  }
};

/* ========================= GET CONFIGURATION BY ID ========================= */

export const getTimeBlockConfigurationById = async (req, res) => {
  try {
    const data = await timeBlockService.getTimeBlockConfigurationById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Time-block configuration not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET TIME-BLOCK CONFIGURATION ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch time-block configuration.",
    });
  }
};

/* ========================= GET BY LOCATION ========================= */

export const getTimeBlocksByLocation = async (req, res) => {
  try {
    const data = await timeBlockService.getTimeBlocksByLocation(req.params.locationId);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET TIME-BLOCKS BY LOCATION ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch time-blocks by location.",
    });
  }
};

/* ========================= GET BY PLANT ========================= */

export const getTimeBlocksByPlant = async (req, res) => {
  try {
    const data = await timeBlockService.getTimeBlocksByPlant(req.params.plantId);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET TIME-BLOCKS BY PLANT ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch time-blocks by plant.",
    });
  }
};

/* ========================= GET BY SHIFT ========================= */

export const getTimeBlocksByShift = async (req, res) => {
  try {
    const data = await timeBlockService.getTimeBlocksByShift(req.params.shiftId);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET TIME-BLOCKS BY SHIFT ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch time-blocks by shift.",
    });
  }
};

/* ========================= GET ACTIVE CONFIGURATION ========================= */

export const getActiveTimeBlockConfiguration = async (req, res) => {
  try {
    const { locationId, plantId, shiftId, conveyorId } = req.query;

    if (!locationId || !plantId || !shiftId) {
      return res.status(400).json({
        success: false,
        message: "Location, Plant and Shift are required.",
      });
    }

    const data = await timeBlockService.getActiveTimeBlockConfiguration({
      locationId,
      plantId,
      shiftId,
      conveyorId,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No active time-block configuration found.",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ACTIVE TIME-BLOCK CONFIGURATION ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch active time-block configuration.",
    });
  }
};

/* ========================= UPDATE CONFIGURATION ========================= */

export const updateTimeBlockConfiguration = async (req, res) => {
  try {
    const data = await timeBlockService.updateTimeBlockConfiguration(req.params.id, req.body);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Time-block configuration not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Time-block configuration updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE TIME-BLOCK CONFIGURATION ERROR:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to update time-block configuration.",
    });
  }
};

/* ========================= TOGGLE STATUS ========================= */

export const toggleTimeBlockConfigurationStatus = async (req, res) => {
  try {
    const data = await timeBlockService.toggleTimeBlockConfigurationStatus(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Time-block configuration not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Time-block configuration ${data.status.toLowerCase()} successfully.`,
      data,
    });
  } catch (error) {
    console.error("TOGGLE TIME-BLOCK STATUS ERROR:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to change time-block configuration status.",
    });
  }
};

/* ========================= DELETE CONFIGURATION ========================= */

export const deleteTimeBlockConfiguration = async (req, res) => {
  try {
    const data = await timeBlockService.deleteTimeBlockConfiguration(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Time-block configuration not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Time-block configuration deleted successfully.",
      data,
    });
  } catch (error) {
    console.error("DELETE TIME-BLOCK CONFIGURATION ERROR:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to delete time-block configuration.",
    });
  }
};

/* ========================= GENERATE HOURLY BLOCKS ========================= */

export const generateHourlyBlocks = async (req, res) => {
  try {
    const { shiftId } = req.body;

    if (!shiftId) {
      return res.status(400).json({
        success: false,
        message: "Shift is required.",
      });
    }

    const data = await timeBlockService.generateHourlyBlocks(req.body);

    return res.status(200).json({
      success: true,
      message: "Hourly time-blocks generated successfully.",
      data,
    });
  } catch (error) {
    console.error("GENERATE HOURLY BLOCKS ERROR:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to generate hourly time-blocks.",
    });
  }
};

/* ========================= CALCULATE CURRENT BLOCK ========================= */

export const getCurrentTimeBlock = async (req, res) => {
  try {
    const { configurationId, timestamp } = req.query;

    if (!configurationId) {
      return res.status(400).json({
        success: false,
        message: "Configuration ID is required.",
      });
    }

    const data = await timeBlockService.getCurrentTimeBlock(
      configurationId,
      timestamp ? new Date(timestamp) : new Date()
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No active time-block found for the current time.",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET CURRENT TIME-BLOCK ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to determine current time-block.",
    });
  }
};