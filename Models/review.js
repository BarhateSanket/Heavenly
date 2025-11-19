const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const reviewSchema = new Schema({
    comment: String,
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    detailedRatings: {
        cleanliness: { type: Number, min: 1, max: 5 },
        accuracy: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        location: { type: Number, min: 1, max: 5 },
        checkIn: { type: Number, min: 1, max: 5 },
        value: { type: Number, min: 1, max: 5 }
    },
    photos: [{
        type: String
    }],
    verified: {
        type: Boolean,
        default: false
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking"
    },
    hostResponse: {
        response: String,
        respondedAt: Date,
        respondedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    reports: [{
        reason: String,
        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        reportedAt: {
            type: Date,
            default: Date.now()
        }
    }],
    moderated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
});

// Activity and notification generation hook
reviewSchema.post('save', async function(doc) {
    if (doc.isNew) {  // Only for new documents
        const Activity = require('./activity');
        const Notification = require('./notification');

        // Get listing and host from booking
        let listing = null;
        let hostId = null;
        let listingTitle = 'a listing';
        if (doc.booking) {
            const Booking = mongoose.model('Booking');
            const booking = await Booking.findById(doc.booking).populate('listing');
            if (booking && booking.listing) {
                listing = booking.listing;
                listingTitle = booking.listing.title;
                hostId = booking.listing.owner;
            }
        }

        await Activity.create({
            actor: doc.author,
            type: 'review_posted',
            target: doc._id,
            targetModel: 'Review',
            metadata: {
                listingTitle: listingTitle,
                rating: doc.rating
            }
        });

        // Notify host of new review
        if (hostId) {
            await Notification.createNotification(
                hostId,
                'new_review',
                'New Review',
                `Your listing "${listingTitle}" received a new review`,
                { reviewId: doc._id, listingId: listing?._id, authorId: doc.author }
            );
        }
    } else if (doc.isModified('hostResponse.response') && doc.hostResponse.response) {
        // Host responded to review
        const Notification = require('./notification');
        await Notification.createNotification(
            doc.author,
            'review_response',
            'Review Response',
            'The host has responded to your review',
            { reviewId: doc._id }
        );
    }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

