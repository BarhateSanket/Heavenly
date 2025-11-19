const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const Comment = require("./comment.js");


const listingSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    image: {type: String, required: true,
        default: "https://unsplash.com/photos/a-woman-standing-on-top-of-a-snow-covered-slope-1yqA4OyC6gQ",
        set: (v) => v === "" ? "https://unsplash.com/photos/a-woman-standing-on-top-of-a-snow-covered-slope-1yqA4OyC6gQ": v},
    price: {type: Number, required: true},
    location: {type: String, required: true},
    country: {type: String, required: true},
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }],
    owner:{
        type: Schema.Types.ObjectId,
        ref:"user",
    },
    maxGuests: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    blockedDates: [{
        type: Date
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    premiumTier: {
        type: String,
        enum: ['basic', 'premium', 'gold'],
        default: null
    },
    featuredExpiry: {
        type: Date,
        default: null
    },
    premiumExpiry: {
        type: Date,
        default: null
    },
    premiumActivatedAt: {
        type: Date,
        default: null
    },
});

listingSchema.post("findOneAndDelete", async function(listing){
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}});
        await Comment.deleteMany({_id: {$in: listing.comments}});
    }
});

// Activity generation hook
listingSchema.post('save', async function(doc) {
    if (doc.isNew) {  // Only for new documents
        const Activity = require('./activity');
        await Activity.create({
            actor: doc.owner,
            type: 'listing_created',
            target: doc._id,
            targetModel: 'Listing',
            metadata: {
                title: doc.title,
                location: doc.location
            }
        });
    }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;