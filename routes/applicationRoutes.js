import express from "express";
import {
    applyForJob,
    getMyApplications
} from "../controllers/applicationController.js";
import authMiddleware from "../middlewere/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, applyForJob);
router.get("/my", authMiddleware, getMyApplications);

export default router;