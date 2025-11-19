const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message"
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ listing: 1 });

// Update updatedAt on save
conversationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Conversation", conversationSchema);