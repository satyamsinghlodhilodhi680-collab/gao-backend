
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Job title is required"],
            trim: true,
            maxlength: 100
        },

        category: {
            type: String,
            required: [true, "Job category is required"],
            enum: [
                "Labour",
                "Tractor Service",
                "Electrician",
                "Plumber",
                "Other Services"
            ]
        },

        description: {
            type: String,
            required: [true, "Job description is required"],
            trim: true,
            maxlength: 2000
        },

        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
            maxlength: 150
        },

        contactNumber: {
            type: String,
            required: [true, "Contact number is required"],
            match: [/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"]
        },

        salary: {
            type: Number,
            min: 0,
            default: null
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
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

const Job = mongoose.model("Job", jobSchema);

export default Job;
