
import express from "express";

import {
    createJob,
    getApprovedJobs,
    getPendingJobs,
    updateJobStatus,
    getMyJobs
} from "../controllers/jobController.js";

import authMiddleware from "../middlewere/authMiddleware.js";
import adminMiddleware from "../middlewere/adminMiddleware.js";

const router = express.Router();

// Public: Only approved jobs
router.get("/", getApprovedJobs);

// Admin: View pending jobs
router.get("/pending", authMiddleware, adminMiddleware, getPendingJobs);

// Admin: Approve or reject a job
router.patch("/:id/status", authMiddleware, adminMiddleware, updateJobStatus);

// Logged-in users: Submit jobs for approval
router.post("/", authMiddleware, createJob);

router.get("/my", authMiddleware, getMyJobs);

export default router;

