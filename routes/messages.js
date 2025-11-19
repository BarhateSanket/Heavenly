const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { messageSchema, conversationSchema } = require("../schema.js");
const Conversation = require("../Models/conversation.js");
const Message = require("../Models/message.js");
const Listing = require("../Models/listing.js");
const Follow = require("../Models/follow.js");
const { isLoggedIn } = require("../middleware.js");

const validateMessage = (req, res, next) => {
    const { error } = messageSchema.validate(req.body);
    if (error) {
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

const validateConversation = (req, res, next) => {
    const { error } = conversationSchema.validate(req.body);
    if (error) {
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

// Middleware to check if user is participant in conversation
const isConversationParticipant = async (req, res, next) => {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId).populate('participants');

    if (!conversation) {
        req.flash("error", "Conversation not found!");
        return res.redirect("/messages");
    }

    const isParticipant = conversation.participants.some(participant =>
        participant._id.equals(req.user._id)
    );

    if (!isParticipant) {
        req.flash("error", "You don't have permission to access this conversation!");
        return res.redirect("/messages");
    }

    req.conversation = conversation;
    next();
};

// Index Route - Inbox (list all conversations for current user)
router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
    const conversations = await Conversation.find({
        participants: req.user._id
    })
    .populate('participants', 'username')
    .populate('listing', 'title location')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

    // Get unread count for navbar
    const unreadCount = await Message.countDocuments({
        conversation: { $in: conversations.map(c => c._id) },
        sender: { $ne: req.user._id },
        isRead: false
    });

    res.render("messages/index.ejs", {
        conversations,
        unreadCount
    });
}));

// Show Route - Chat interface
router.get("/:conversationId", isLoggedIn, isConversationParticipant, wrapAsync(async (req, res) => {
    const conversation = req.conversation;

    // Mark messages as read
    await Message.updateMany(
        {
            conversation: conversation._id,
            sender: { $ne: req.user._id },
            isRead: false
        },
        {
            isRead: true,
            readAt: new Date()
        }
    );

    // Get messages with pagination (last 50 messages)
    const messages = await Message.find({ conversation: conversation._id })
        .populate('sender', 'username')
        .sort({ createdAt: 1 })
        .limit(50);

    // Get other participant
    const otherParticipant = conversation.participants.find(p => !p._id.equals(req.user._id));

    res.render("messages/chat.ejs", {
        conversation,
        messages,
        otherParticipant
    });
}));

// Create Conversation Route (Contact Host)
router.post("/", isLoggedIn, validateConversation, wrapAsync(async (req, res) => {
    const { listingId, recipientId, initialMessage } = req.body.conversation;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Check if user is trying to message themselves
    if (req.user._id.equals(recipientId)) {
        req.flash("error", "You cannot message yourself!");
        return res.redirect(`/listings/${listingId}`);
    }

    // Check if users have a follow relationship (mutual follow required for messaging)
    const followRelationship = await Follow.findOne({
        $or: [
            { follower: req.user._id, following: recipientId },
            { follower: recipientId, following: req.user._id }
        ]
    });

    if (!followRelationship) {
        req.flash("error", "You can only message users you follow or who follow you!");
        return res.redirect(`/listings/${listingId}`);
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
        participants: { $all: [req.user._id, recipientId] },
        listing: listingId
    });

    if (existingConversation) {
        // Redirect to existing conversation
        return res.redirect(`/messages/${existingConversation._id}`);
    }

    // Create new conversation
    const conversation = new Conversation({
        participants: [req.user._id, recipientId],
        listing: listingId
    });

    await conversation.save();

    // Create initial message
    const message = new Message({
        conversation: conversation._id,
        sender: req.user._id,
        content: initialMessage
    });

    await message.save();

    req.flash("success", "Message sent successfully!");
    res.redirect(`/messages/${conversation._id}`);
}));

// Send Message Route
router.post("/:conversationId/messages", isLoggedIn, isConversationParticipant, validateMessage, wrapAsync(async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body.message;

    const message = new Message({
        conversation: conversationId,
        sender: req.user._id,
        content: content
    });

    await message.save();

    // Return JSON for AJAX requests
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        const populatedMessage = await Message.findById(message._id).populate('sender', 'username');
        return res.json({
            success: true,
            message: {
                _id: populatedMessage._id,
                content: populatedMessage.content,
                sender: {
                    _id: populatedMessage.sender._id,
                    username: populatedMessage.sender.username
                },
                createdAt: populatedMessage.createdAt
            }
        });
    }

    res.redirect(`/messages/${conversationId}`);
}));

// API Route - Get unread count
router.get("/api/unread-count", isLoggedIn, wrapAsync(async (req, res) => {
    const conversations = await Conversation.find({
        participants: req.user._id
    });

    const unreadCount = await Message.countDocuments({
        conversation: { $in: conversations.map(c => c._id) },
        sender: { $ne: req.user._id },
        isRead: false
    });

    res.json({ unreadCount });
}));

// API Route - Get messages for a conversation (AJAX)
router.get("/:conversationId/api/messages", isLoggedIn, isConversationParticipant, wrapAsync(async (req, res) => {
    const { conversationId } = req.params;
    const { before, limit = 50 } = req.query;

    let query = { conversation: conversationId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .populate('sender', 'username')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    // Reverse to get chronological order
    messages.reverse();

    res.json({
        success: true,
        messages: messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            sender: {
                _id: msg.sender._id,
                username: msg.sender.username
            },
            createdAt: msg.createdAt,
            isRead: msg.isRead
        }))
    });
}));

// API Route - Mark messages as read
router.post("/:conversationId/api/mark-read", isLoggedIn, isConversationParticipant, wrapAsync(async (req, res) => {
    const { conversationId } = req.params;

    await Message.updateMany(
        {
            conversation: conversationId,
            sender: { $ne: req.user._id },
            isRead: false
        },
        {
            isRead: true,
            readAt: new Date()
        }
    );

    res.json({ success: true });
}));

module.exports = router;