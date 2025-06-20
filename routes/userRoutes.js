import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/profile
router.get("/profile", protect, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email });
});

export default router;
