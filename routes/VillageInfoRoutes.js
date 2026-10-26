
import express from "express";

import {
  getVillageInfo,
  createVillageInfo,
  updateVillageInfo,
} from "../controllers/VillageInfoController.js";

import authMiddleware from "../middlewere/authMiddleware.js";
import adminMiddleware from "../middlewere/adminMiddleware.js";
const router = express.Router();

// Public: Read village information
router.get("/", getVillageInfo);

// Admin only: Create village information
router.post("/", authMiddleware, adminMiddleware, createVillageInfo);

// Admin only: Update village information
router.put("/", authMiddleware, adminMiddleware, updateVillageInfo);

export default router;
