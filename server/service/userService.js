import User from '../model/userModel.js';

// Create a new user
export const createUserService = async (userData) => {
  const user = await User.create(userData);
  return user;
};

// Get all users
export const getAllUsersService = async () => {
  const users = await User.find();
  return users;
};

// Get a single user by ID
export const getUserByIdService = async (id) => {
  const user = await User.findById(id);
  return user;
};

// Update a user
export const updateUserService = async (id, userData) => {
  const user = await User.findByIdAndUpdate(id, userData, { new: true });
  return user;
};

// Delete a user
export const deleteUserService = async (id) => {
  const user = await User.findByIdAndDelete(id);
  return user;
};
