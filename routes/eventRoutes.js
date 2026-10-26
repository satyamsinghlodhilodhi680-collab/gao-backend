
import express from "express";
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
} from "../controllers/eventController.js";

import authMiddleware from "../middlewere/authMiddleware.js";
import adminMiddleware from "../middlewere/adminMiddleware.js";

const router = express.Router();
// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Admin-only routes
router.post("/", authMiddleware, adminMiddleware, createEvent);
router.put("/:id", authMiddleware, adminMiddleware, updateEvent);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEvent);

export default router;
