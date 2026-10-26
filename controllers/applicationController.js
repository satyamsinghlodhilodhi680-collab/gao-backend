
import Application from "../models/Application.js";
import Job from "../models/Job.js";

// Apply for a job
export const applyForJob = async (req, res) => {
    try {
        const { jobId, coverLetter } = req.body;

        if (!jobId || !coverLetter?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job ID and cover letter are required"
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        if (coverLetter.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Cover letter cannot exceed 2000 characters"
            });
        }

      const job = await Job.findOne({
    _id: jobId,
    status: "approved"
});

if (!job) {
    return res.status(404).json({
        success: false,
        message: "Approved job not found"
    });
}

// Job post karne wala apni hi job par apply nahi kar sakta.
if (job.postedBy.toString() === req.userId.toString()) {
    return res.status(400).json({
        success: false,
        message: "You cannot apply for your own job"
    });
}
        // Duplicate applications are prevented by the unique
        // job + applicant index in Application.js.
        const application = await Application.create({
            job: job._id,
            applicant: req.userId,
            coverLetter: coverLetter.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Job application submitted successfully",
            application
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        console.error("Apply for job error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get logged-in user's applications
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            applicant: req.userId
        })
            .populate("job")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error("Get applications error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
