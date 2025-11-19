const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    listings: [{
        type: Schema.Types.ObjectId,
        ref: "Listing",
    }],
    isPrivate: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Track original listings for change detection
wishlistSchema.pre('save', function(next) {
    this._originalListings = this.isModified('listings') ? [...this.get('listings', null, { getters: false })] : undefined;
    next();
});

// Activity generation hook for wishlist additions
wishlistSchema.post('save', async function(doc) {
    if (this._originalListings !== undefined) {
        const Activity = require('./activity');
        const addedListings = doc.listings.filter(id => !this._originalListings.some(origId => origId.equals(id)));

        for (const listingId of addedListings) {
            // Get listing details
            const Listing = mongoose.model('Listing');
            const listing = await Listing.findById(listingId).select('title');

            if (listing) {
                await Activity.create({
                    actor: doc.user,
                    type: 'wishlist_added',
                    target: listingId,  // Target is the listing
                    targetModel: 'Listing',
                    metadata: {
                        listingTitle: listing.title,
                        wishlistName: doc.name
                    }
                });
            }
        }
    }
});

module.exports = mongoose.model("Wishlist", wishlistSchema);