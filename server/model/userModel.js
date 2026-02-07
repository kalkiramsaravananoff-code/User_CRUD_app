import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
//   dateOfBirth: {
//     type: Date,
//     required: false,
//   },
//   address: {
//     type: String,
//     required: false,
//   },
});

const User = mongoose.model("user", userSchema);

export default User;

