
import express from "express";

import {
   createComplaint, getAllComplaints,
   getMyComplaints,
    updateComplaintStatus
} from "../controllers/complaintController.js";

import authMiddleware from "../middlewere/authMiddleware.js";
import adminMiddleware from "../middlewere/adminMiddleware.js";

const router = express.Router();

// Admin can view all complaints
router.get(
    "/",
    authMiddleware,
    adminMiddleware,
    getAllComplaints
);

// Admin can update complaint status
router.patch(
    "/:id/status",
    authMiddleware,
    adminMiddleware,
    updateComplaintStatus
);

// Logged-in users can submit complaints
router.post(
    "/",
    authMiddleware,
    createComplaint
);

router.get(
    "/my",
    authMiddleware,
    getMyComplaints
);


export default router;
