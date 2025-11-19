const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Notification = require("../Models/notification.js");
const User = require("../Models/user");
const { isLoggedIn } = require("../middleware.js");

// Validation middleware for preferences
const validatePreferences = (req, res, next) => {
    const { email, push, types } = req.body;
    if (typeof email !== 'boolean' || typeof push !== 'boolean') {
        throw new ExpressError("Invalid preferences format", 400);
    }
    if (types && typeof types !== 'object') {
        throw new ExpressError("Invalid types format", 400);
    }
    next();
};

// Get user's notifications
router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Notification.countDocuments({ user: req.user._id });
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.render("notifications/index.ejs", {
        notifications,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        unreadCount
    });
}));

// API: Get notifications (JSON)
router.get("/api", isLoggedIn, wrapAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Notification.countDocuments({ user: req.user._id });

    res.json({
        notifications,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        }
    });
}));

// API: Get unread count
router.get("/api/unread-count", isLoggedIn, wrapAsync(async (req, res) => {
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ unreadCount });
}));

// API: Mark notification as read
router.put("/api/:id/read", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, user: req.user._id });

    if (!notification) {
        throw new ExpressError("Notification not found", 404);
    }

    if (!notification.isRead) {
        notification.isRead = true;
        await notification.save();
    }

    res.json({ success: true });
}));

// API: Mark all notifications as read
router.put("/api/read-all", isLoggedIn, wrapAsync(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
    );

    res.json({ success: true });
}));

// API: Get user preferences
router.get("/api/preferences", isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    res.json(user.notificationPreferences);
}));

// API: Update user preferences
router.put("/api/preferences", isLoggedIn, validatePreferences, wrapAsync(async (req, res) => {
    const { email, push, types } = req.body;

    const updateData = {
        'notificationPreferences.email': email,
        'notificationPreferences.push': push
    };

    if (types) {
        if (types.booking !== undefined) updateData['notificationPreferences.types.booking'] = types.booking;
        if (types.message !== undefined) updateData['notificationPreferences.types.message'] = types.message;
        if (types.review !== undefined) updateData['notificationPreferences.types.review'] = types.review;
    }

    await User.findByIdAndUpdate(req.user._id, updateData);

    res.json({ success: true, message: "Preferences updated successfully" });
}));

module.exports = router;