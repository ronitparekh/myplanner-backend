import express from "express";
import {
  createEvent,
  getUserEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes below
router.use(protect);

// POST /api/events - create new event
router.post("/", createEvent);

// GET /api/events - get all events for logged-in user
router.get("/", getUserEvents);

// PUT /api/events/:id - update specific event
router.put("/:id", updateEvent);

// DELETE /api/events/:id - delete specific event
router.delete("/:id", deleteEvent);

export default router;
