
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },

    profilePhoto: {
    type: String,
    default: ""
},
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    isVerified: {
    type: Boolean,
    
    default: false
},
emailOtp: {
    type: String,
    default: null
},
emailOtpExpires: {
    type: Date,
    default: null
},
resetPasswordOtp: {
    type: String,
    default: null
},
resetPasswordOtpExpires: {
    type: Date,
    default: null
},
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
