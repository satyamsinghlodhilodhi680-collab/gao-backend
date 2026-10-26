
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate a secure 6-digit OTP
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP before storing it in the database
const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

// Send email using Resend API
const sendEmail = async ({ to, subject, text }) => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is missing");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: "Gao-Connect <onboarding@resend.dev>",
            to: [to],
            subject,
            text
        }),
        signal: AbortSignal.timeout(15000)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error("Resend email error:", response.status, result);
        throw new Error("Resend failed to send email");
    }

    return result;
};

// Send registration verification OTP
const sendOtpEmail = async (email, otp) => {
    await sendEmail({
        to: email,
        subject: "Gao-Connect Email Verification OTP",
        text: `Your Gao-Connect verification OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
    });
};

// REGISTER
export const register = async (req, res) => {
    let createdUserId = null;

    try {
        const { firstName, lastName, email, password } = req.body;

        if (
            !firstName?.trim() ||
            !lastName?.trim() ||
            !email?.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is missing");
        }

        const normalizedEmail = email.trim().toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });

        if (user?.isVerified === true) {
            return res.status(409).json({
                success: false,
                message: "Email already registered. Please login."
            });
        }

        if (user) {
            const passwordMatches = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            user = new User({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                isVerified: false
            });

            await user.save();
            createdUserId = user._id;
        }

        const otp = generateOtp();

        user.emailOtp = hashOtp(otp);
        user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await user.save();

        try {
            await sendOtpEmail(user.email, otp);
        } catch (emailError) {
            if (createdUserId) {
                await User.findByIdAndDelete(createdUserId);
            }

            console.error("OTP email error:", emailError.message);

            return res.status(500).json({
                success: false,
                message: "Could not send verification email. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email. Verify your email to activate your account.",
            email: user.email
        });
    } catch (error) {
        console.error("Register error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// VERIFY EMAIL OTP
export const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email?.trim() || !otp?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const cleanOtp = otp.trim();

        if (!/^\d{6}$/.test(cleanOtp)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 6-digit OTP"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP"
            });
        }

        if (user.isVerified === true) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified. Please login."
            });
        }

        if (
            !user.emailOtp ||
            !user.emailOtpExpires ||
            new Date(user.emailOtpExpires).getTime() < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Please request a new one."
            });
        }

        const submittedOtpHash = hashOtp(cleanOtp);

        const hashesMatch = crypto.timingSafeEqual(
            Buffer.from(submittedOtpHash, "hex"),
            Buffer.from(user.emailOtp, "hex")
        );

        if (!hashesMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again."
            });
        }

        user.isVerified = true;
        user.emailOtp = null;
        user.emailOtpExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now login."
        });
    } catch (error) {
        console.error("OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (user.isVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email with OTP before logging in."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

       res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
});

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("-password -emailOtp -emailOtpExpires");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// LOGOUT
export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

// UPDATE USER PROFILE
export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        if (!firstName?.trim() || !lastName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name and last name are required"
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.firstName = firstName.trim();
        user.lastName = lastName.trim();

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Update profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please log in again."
        });
    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// RESEND REGISTRATION OTP
export const resendOtp = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found. Please register first."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified. Please login."
            });
        }

        const otp = generateOtp();

        user.emailOtp = hashOtp(otp);
        user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await user.save();
        await sendOtpEmail(user.email, otp);

        return res.status(200).json({
            success: true,
            message: "A new verification OTP has been sent to your email."
        });
    } catch (error) {
        console.error("Resend OTP error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not send OTP. Please try again later."
        });
    }
};

// FORGOT PASSWORD — SEND RESET OTP
export const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({
            email,
            isVerified: true
        });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If a verified account exists, a reset OTP will be sent."
            });
        }

        const otp = generateOtp();

        user.resetPasswordOtp = hashOtp(otp);
        user.resetPasswordOtpExpires =
            new Date(Date.now() + 10 * 60 * 1000);

        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: "Gao-Connect password reset OTP",
                text: `Your password reset OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
            });
        } catch (emailError) {
            user.resetPasswordOtp = null;
            user.resetPasswordOtpExpires = null;
            await user.save();

            throw emailError;
        }

        return res.status(200).json({
            success: true,
            message: "If a verified account exists, a reset OTP will be sent."
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not process the request. Please try again later."
        });
    }
};

// RESET PASSWORD — VERIFY OTP AND SAVE NEW PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (
            !email?.trim() ||
            !otp?.trim() ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const cleanOtp = otp.trim();

        if (!/^\d{6}$/.test(cleanOtp)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 6-digit OTP"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            isVerified: true
        });

        if (
            !user ||
            !user.resetPasswordOtp ||
            !user.resetPasswordOtpExpires ||
            new Date(user.resetPasswordOtpExpires).getTime() < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset OTP. Please request a new one."
            });
        }

        const submittedHash = hashOtp(cleanOtp);

        const hashesMatch = crypto.timingSafeEqual(
            Buffer.from(submittedHash, "hex"),
            Buffer.from(user.resetPasswordOtp, "hex")
        );

        if (!hashesMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again."
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in."
        });
    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not reset password. Please try again."
        });
    }
};
