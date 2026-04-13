import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* REGISTER */
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("REGISTER EMAIL:", email);

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

    console.log("LOGIN EMAIL:", email);

    const user = await User.findOne({ email });
    console.log("LOGIN USER FOUND:", user);

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

    console.log("FORGOT EMAIL:", email);

    const user = await User.findOne({ email });

    console.log("USER FOUND:", user);

    
    if (!user) {
      return res.json({
        message: "If email exists, reset link sent",
      });
    }

    // 🔥 Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 2 * 60 * 1000; // ✅ 2 mins

    await user.save();

    const resetUrl = `https://frontend-three-alpha-65.vercel.app/reset-password/${resetToken}`;

    // 🔥 Mail transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT), // ✅ safer
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 🔥 Send email
    await transporter.sendMail({
      from: '"Auth App" <no-reply@auth.com>',
      to: user.email,
      subject: "Password Reset",
      html: `
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 2 minutes.</p>
      `,
    });

    res.json({
      message: "Reset link sent to your email",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    console.log("RESET TOKEN:", token);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    console.log("RESET USER FOUND:", user);

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successful",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
