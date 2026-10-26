
import express from "express";
import { getMe, login, logout, register,  verifyEmailOtp ,updateProfile,changePassword,resendOtp,forgotPassword,resetPassword} from "../controllers/authController.js";
import authMiddleware from "../middlewere/authMiddleware.js";
import adminMiddleware from "../middlewere/adminMiddleware.js";
import { adminDashboard } from "../controllers/adminController.js";
const router = express.Router();

router.post("/register", register);
router.post("/login",login);
router.post("/logout",logout)

router.post("/verify-otp", verifyEmailOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get('/get-me',authMiddleware,getMe)

router.put("/update-profile", authMiddleware, updateProfile);

router.put("/change-password", authMiddleware, changePassword);
router.get(
    "/admin/dashboard",
    authMiddleware,
    
    adminMiddleware,
    adminDashboard
);
export default router;

