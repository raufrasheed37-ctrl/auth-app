import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  resetPasswordToken: {
    type: String,
  },

  resetPasswordExpire: {
    type: Date,
  },

}, { timestamps: true });

export default mongoose.model("User", userSchema);
