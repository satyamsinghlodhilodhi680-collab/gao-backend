
import User from "../models/User.js";
import Notice from "../models/Notice.js";
import Complaint from "../models/Complaint.js";

export const adminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalNotices = await Notice.countDocuments();
        const totalComplaints = await Complaint.countDocuments();

        const pendingComplaints = await Complaint.countDocuments({
            status: "Pending"
        });

        res.status(200).json({
            success: true,
            message: "Admin Dashboard Data",
            stats: {
                totalUsers,
                totalNotices,
                totalComplaints,
                pendingComplaints
            }
        });
    } catch (error) {
        console.error("Admin Dashboard Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data"
        });
    }
};
