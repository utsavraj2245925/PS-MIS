import Location from "../models/location.model.js";

/* ==========================================================
   GET ALL LOCATIONS
========================================================== */

export const getLocations = async (req, res) => {
  try {

    const locations = await Location.find({
      status: "Active",
    })
      .sort({
        locationName: 1,
      });

    return res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


/* ==========================================================
   GET SINGLE LOCATION
========================================================== */

export const getLocationById = async (req, res) => {
  try {

    const location = await Location.findById(req.params.id);

    if (!location) {

      return res.status(404).json({
        success: false,
        message: "Location not found",
      });

    }

    return res.status(200).json({
      success: true,
      location,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};