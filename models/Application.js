
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true
        },

        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        coverLetter: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        status: {
            type: String,
            enum: [
                "pending",
                "reviewed",
                "shortlisted",
                "rejected"
            ],
            default: "pending"
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Ek user ek job par sirf ek application submit kar sakta hai.
applicationSchema.index(
    { job: 1, applicant: 1 },
    { unique: true }
);

const Application = mongoose.model(
    "Application",
    applicationSchema
);

export default Application;
