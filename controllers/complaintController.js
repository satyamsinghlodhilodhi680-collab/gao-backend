
import Complaint from "../models/Complaint.js";

export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate("createdBy", "firstName lastName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            complaints
        });
    } catch (error) {
        console.error("Get Complaints Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch complaints"
        });
    }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "In Progress",
            "Resolved"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint status"
            });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Complaint status updated successfully",
            complaint
        });
    } catch (error) {
        console.error("Update Complaint Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update complaint status"
        });
    }
};

export const createComplaint = async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: "Title, description and category are required"
            });
        }

        const complaint = await Complaint.create({
            title,
            description,
            category,
            createdBy: req.userId
        });

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully",
            complaint
        });
    } catch (error) {
        console.error("Create Complaint Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit complaint"
        });
    }
};

export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            createdBy: req.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            complaints
        });
    } catch (error) {
        console.error("Get My Complaints Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your complaints"
        });
    }
};
