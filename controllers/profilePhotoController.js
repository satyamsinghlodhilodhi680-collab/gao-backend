
import imagekit from "../config/imagekit.js";
import User from "../models/User.js";

const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a profile photo"
            });
        }

        const uploadedImage = await imagekit.upload({
            file: req.file.buffer,
            fileName: `profile-${req.userId}-${Date.now()}`,
            folder: "/gao-connect/profiles"
        });

        const user = await User.findByIdAndUpdate(
    req.userId,
    { profilePhoto: uploadedImage.url },
    { returnDocument: "after", runValidators: true }
).select("-password -emailOtp -emailOtpExpires");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile photo uploaded successfully",
            profilePhoto: user.profilePhoto,
            user
        });
    } catch (error) {
        console.error("Profile photo upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload profile photo"
        });
    }
};

export { uploadProfilePhoto };
