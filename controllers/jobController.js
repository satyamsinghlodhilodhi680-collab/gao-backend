
import Job from "../models/Job.js";

export const createJob = async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            location,
            contactNumber,
            salary
        } = req.body;

        if (
            !title ||
            !category ||
            !description ||
            !location ||
            !contactNumber
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        const job = await Job.create({
            title,
            category,
            description,
            location,
            contactNumber,
            salary:
                salary === "" || salary == null
                    ? null
                    : Number(salary),
            postedBy: req.userId,
            status: "pending"
        });

        return res.status(201).json({
            success: true,
            message: "Job submitted for admin approval",
            job
        });
    } catch (error) {
        console.error("Create Job Error:", error);

        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to submit job"
        });
    }
};

export const getApprovedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: "approved" })
            .select("-contactNumber")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error("Get Approved Jobs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs"
        });
    }
};

export const getPendingJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: "pending" })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error("Get Pending Jobs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending jobs"
        });
    }
};

export const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved or rejected"
            });
        }

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        job.status = status;
        job.reviewedBy = req.userId;
        job.reviewedAt = new Date();

        await job.save();

        return res.status(200).json({
            success: true,
            message: `Job ${status} successfully`,
            job
        });
    } catch (error) {
        console.error("Update Job Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update job status"
        });
    }
};



export const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            postedBy: req.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error("Get My Jobs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your jobs"
        });
    }
};
