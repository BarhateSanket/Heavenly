const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    actor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: [
            'listing_created',
            'review_posted',
            'booking_made',
            'booking_confirmed',
            'booking_cancelled',
            'user_followed',
            'wishlist_added',
            'message_sent'
        ],
        required: true
    },
    target: {
        type: Schema.Types.ObjectId,
        required: true,
        // Can reference Listing, Booking, Review, User, Wishlist, Message
    },
    targetModel: {
        type: String,
        enum: ['Listing', 'Booking', 'Review', 'User', 'Wishlist', 'Message'],
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        index: true
    }
});

// Compound indexes for efficient queries
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

activitySchema.methods.isVisibleTo = function(viewerId) {
    const viewer = viewerId;
    const actor = this.actor;

    // Always visible to self
    if (viewer && viewer.equals(actor)) {
        return true;
    }

    // Check actor's privacy setting
    // This will be populated when querying
    if (this.actor.isPrivate) {
        // Only followers can see private users' activities
        return viewer && this.actor.followers && this.actor.followers.includes(viewer);
    }

    // Public activities visible to all logged-in users
    return !!viewer;
};

module.exports = mongoose.model("Activity", activitySchema);