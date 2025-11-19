const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
});

// Store original status for change tracking
bookingSchema.pre('save', function(next) {
    this._originalStatus = this.isModified('status') ? this.get('status', null, { getters: false }) : undefined;
    this.updatedAt = Date.now();
    next();
});

// Activity and notification generation hooks
bookingSchema.post('save', async function(doc) {
    const Activity = require('./activity');
    const Notification = require('./notification');

    if (doc.isNew) {
        // New booking made
        await Activity.create({
            actor: doc.guest,
            type: 'booking_made',
            target: doc._id,
            targetModel: 'Booking',
            metadata: {
                listingTitle: doc.listing?.title || 'a listing',
                checkIn: doc.checkIn,
                checkOut: doc.checkOut
            }
        });

        // Notify host of new booking
        const populatedDoc = await doc.populate('listing');
        if (populatedDoc.listing && populatedDoc.listing.owner) {
            await Notification.createNotification(
                populatedDoc.listing.owner,
                'booking_confirmed', // Using confirmed for new bookings, or create new type?
                'New Booking Request',
                `You have a new booking request for ${populatedDoc.listing.title}`,
                { bookingId: doc._id, listingId: populatedDoc.listing._id }
            );
        }
    } else if (this._originalStatus !== undefined && this._originalStatus !== doc.status) {
        // Status changed
        let activityType;
        if (doc.status === 'confirmed') {
            activityType = 'booking_confirmed';
        } else if (doc.status === 'cancelled') {
            activityType = 'booking_cancelled';
        }

        if (activityType) {
            // For confirmed/cancelled, the actor is the host (listing owner)
            // We need to populate the listing to get the owner
            const populatedDoc = await doc.populate('listing');
            await Activity.create({
                actor: populatedDoc.listing.owner,
                type: activityType,
                target: doc._id,
                targetModel: 'Booking',
                metadata: {
                    listingTitle: populatedDoc.listing.title,
                    guestName: populatedDoc.guest?.username || populatedDoc.guest?.email || 'a guest',
                    reason: doc.status === 'cancelled' ? 'Booking cancelled' : undefined
                }
            });

            // Notify guest of status change
            const notificationType = doc.status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled';
            const title = doc.status === 'confirmed' ? 'Booking Confirmed' : 'Booking Cancelled';
            const message = doc.status === 'confirmed'
                ? `Your booking for ${populatedDoc.listing.title} has been confirmed`
                : `Your booking for ${populatedDoc.listing.title} has been cancelled`;

            await Notification.createNotification(
                doc.guest,
                notificationType,
                title,
                message,
                { bookingId: doc._id, listingId: populatedDoc.listing._id }
            );
        }
    }
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;