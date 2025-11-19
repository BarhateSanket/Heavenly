const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['booking_confirmed', 'booking_cancelled', 'new_message', 'new_review', 'review_response']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Static method to create and save a notification
notificationSchema.statics.createNotification = async function(userId, type, title, message, data = {}) {
    const notification = new this({
        user: userId,
        type,
        title,
        message,
        data
    });

    await notification.save();

    // Emit real-time notification via Socket.io
    const io = require('../app').io; // Assuming io is exported from app.js
    if (io) {
        io.to(userId.toString()).emit('notification', {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt
        });
    }

    return notification;
};

module.exports = mongoose.model("Notification", notificationSchema);