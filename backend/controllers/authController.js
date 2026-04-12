import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/* REGISTER */
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
    });

    res.json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* LOGIN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If email exists, reset link sent",
      });
    }

    // 2. Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Save token + expiry (15 mins)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // 4. Create reset link (IMPORTANT: change to your frontend URL)
    const resetUrl = `https://your-frontend.vercel.app/reset-password/${resetToken}`;

    // 5. Return link (for testing on phone)
    res.json({
      message: "Reset link generated",
      resetUrl,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
