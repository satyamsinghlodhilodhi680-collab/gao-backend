
import express from "express";
import authMiddleware from "../middlewere/authMiddleware.js";
import upload from "../middlewere/uploadMiddleware.js";
import { uploadProfilePhoto } from "../controllers/profilePhotoController.js";

const router = express.Router();

router.post(
    "/upload",
    authMiddleware,
    upload.single("profilePhoto"),
    uploadProfilePhoto
);

export default router;
