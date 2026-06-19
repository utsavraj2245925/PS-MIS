import User from "../models/UserModel.js";


// CREATE USER
export const createUser = async (req, res) => {
  try {

    const user = await User.create(req.body);

    return res.status(201).json(user);

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });

  }
};


// GET USERS
export const getUsers = async (req, res) => {
  try {

    const users = await User.find().lean();

    return res.json(users);

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });

  }
};


// UPDATE USER
export const updateUser = async (req, res) => {
  try {

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.json(user);

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });

  }
};


// DELETE USER
export const deleteUser = async (req, res) => {
  try {

    await User.findByIdAndDelete(
      req.params.id
    );

    return res.json({
      message: "User Deleted",
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });

  }
};