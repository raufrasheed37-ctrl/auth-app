import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user).select("-password");

  res.json({ user });
});

router.get("/test", (req, res) => {
    res.send("User route works");
});

export default router;