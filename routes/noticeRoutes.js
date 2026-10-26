
import express from "express";
import {
    createNotice,
    getNotices,
    updateNotice,
    deleteNotice
} from "../controllers/noticeController.js";

import authMiddleware from "../middlewere/authMiddleware.js";
import adminMiddleware from "../middlewere/adminMiddleware.js";

const router = express.Router();

// Sirf logged-in admin notice create kar sakta hai
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    createNotice
);

// Logged-in users notices dekh sakte hain
router.get(
    "/",
    authMiddleware,
    getNotices
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    updateNotice
);

router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    deleteNotice
);


export default router;
