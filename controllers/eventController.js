
import Event from "../models/Event.js";
import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

// 1. Create Event
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            time,
            location,
            category
        } = req.body;

        if (!title || !description || !date || !time || !location) {
            return res.status(400).json({
                success: false,
                message: "Title, description, date, time and location are required"
            });
        }

        const event = await Event.create({
            title,
            description,
            date,
            time,
            location,
            category,
            createdBy: req.userId
        });

        const users = await User.find({}, "_id");

await Promise.all(
    users.map((user) =>
        createNotification({
            userId: user._id,
            title: "New Village Event",
            message: `A new event has been scheduled: ${event.title}`,
            type: "general",
            link: "/events"
        })
    )
);

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });
    } catch (error) {
        console.error("Create Event Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create event"
        });
    }
};

// 2. Get All Events
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .sort({ date: 1, time: 1 });

        return res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error("Get Events Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch events"
        });
    }
};

// 3. Get Single Event
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            event
        });
    } catch (error) {
        console.error("Get Event Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch event"
        });
    }
};

// 4. Update Event
export const updateEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            time,
            location,
            category
        } = req.body;

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                date,
                time,
                location,
                category
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        console.error("Update Event Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update event"
        });
    }
};

// 5. Delete Event
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });
    } catch (error) {
        console.error("Delete Event Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete event"
        });
    }
};
