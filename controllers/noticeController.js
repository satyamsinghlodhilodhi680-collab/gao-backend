import Notice from "../models/Notice.js";
import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

export const createNotice = async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const notice = await Notice.create({
            title,
            description,
            category,
            createdBy: req.userId
        });
        const users = await User.find({}, "_id");

await Promise.all(
  users.map((user) =>
    createNotification({
      userId: user._id,
      title: "New Village Notice",
      message: `A new notice has been published: ${notice.title}`,
      type: "notice",
      link: "/notices"
    })
  )
);

        res.status(201).json({
            success: true,
            message: "Notice created successfully",
            notice
        });
    } catch (error) {
  console.error("Create Notice Error:", error);

  return res.status(500).json({
    success: false,
    message: "Failed to create notice",
    error: error.message
  });
}
};

export const getNotices = async (req, res) => {
    try {
        const notices = await Notice.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notices.length,
            notices
        });
    } catch (error) {
        console.error("Get Notices Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch notices"
        });
    }
};


export const updateNotice = async (req, res) => {
    try {
        const { title, description, category } = req.body;

       
const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { title, description, category },
    { returnDocument: "after", runValidators: true }
);


        if (!notice) {
            return res.status(404).json({
                success: false,
                message: "Notice not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notice updated successfully",
            notice
        });
    } catch (error) {
        console.error("Update Notice Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update notice"
        });
    }
};

export const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findByIdAndDelete(req.params.id);

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: "Notice not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notice deleted successfully"
        });
    } catch (error) {
        console.error("Delete Notice Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete notice"
        });
    }
};

