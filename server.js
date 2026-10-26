
import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import villageInfoRoutes from "./routes/VillageInfoRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import profilePhotoRoutes from "./routes/profilePhotoRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();




const allowedOrigins = [
    "http://localhost:5173",
    "https://gao-frontend.vercel.app"
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true
    })
);


app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/village-info", villageInfoRoutes);
app.use("/api/jobs", jobRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);

app.use("/api/applications", applicationRoutes);
app.use("/api/profile-photo", profilePhotoRoutes);



const startServer = async () => {
    try {
        await connectDB();

        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();