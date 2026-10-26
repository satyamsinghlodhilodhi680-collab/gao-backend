
import Notification from "../models/Notification.js";

const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  link = ""
}) => {
  try {
    if (!userId || !title || !message) {
      return null;
    }

    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      link
    });
  } catch (error) {
    // Notification failure should not break the main feature
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

export default createNotification;
