
import Notification from "../models/Notification.js";

// Get logged-in user's notifications
export const getNotifications = async (req, res) => {
  try {
     const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};

// Mark one notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.userId;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
   const userId = req.userId;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
      error: error.message
    });
  }
};

// Delete one notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;


    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message
    });
  }
};
