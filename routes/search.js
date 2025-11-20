const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../Models/listing.js");
const Booking = require("../Models/booking.js");

// GET route for advanced search
router.get("/", wrapAsync(async (req, res) => {
    const {
        location,
        checkIn,
        checkOut,
        minPrice,
        maxPrice,
        amenities,
        guests,
        page = 1,
        sort = 'recommended'
    } = req.query;

    const limit = 12;
    const skip = (page - 1) * limit;

    let query = {};

    // Location filter
    if (location) {
        query.$or = [
            { title: { $regex: location, $options: 'i' } },
            { location: { $regex: location, $options: 'i' } },
            { country: { $regex: location, $options: 'i' } }
        ];
    }

    // Price filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Guests filter
    if (guests) {
        query.maxGuests = { $gte: parseInt(guests) };
    }

    // Amenities filter (assuming amenities are stored in description or separate field)
    // For now, filter by description containing amenities keywords
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
        const amenityRegex = amenities.map(a => new RegExp(a, 'i'));
        query.description = { $in: amenityRegex };
    }

    // Fetch listings matching basic filters
    let listings = await Listing.find(query)
        .sort(getSortOptions(sort))
        .skip(skip)
        .limit(limit);

    // Filter by availability if dates provided
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        listings = await Promise.all(listings.map(async (listing) => {
            const isAvailable = await checkAvailability(listing._id, checkInDate, checkOutDate);
            return isAvailable ? listing : null;
        }));

        listings = listings.filter(listing => listing !== null);
    }

    const totalListings = await Listing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limit);

    // Fix empty coordinates
    listings = listings.map(listing => {
        if (!listing.geometry || !listing.geometry.coordinates || listing.geometry.coordinates.length !== 2) {
            listing.geometry = {
                type: 'Point',
                coordinates: [78.9629, 20.5937] // Default to India center
            };
        }
        return listing;
    });

    // Add favorite status for logged-in users
    if (res.locals.currUser) {
        const Wishlist = require("../Models/wishlist.js");
        const wishlist = await Wishlist.findOne({ user: res.locals.currUser._id, name: "Favorites" });
        const favoritedIds = wishlist ? wishlist.listings.map(id => id.toString()) : [];

        listings = listings.map(listing => ({
            ...listing.toObject(),
            isFavorited: favoritedIds.includes(listing._id.toString())
        }));
    }

    res.render("search.ejs", {
        listings,
        location,
        checkIn,
        checkOut,
        minPrice,
        maxPrice,
        amenities: amenities ? (Array.isArray(amenities) ? amenities : [amenities]) : [],
        guests,
        currentPage: parseInt(page),
        totalPages,
        sort
    });
}));

// Helper function to check availability
async function checkAvailability(listingId, checkIn, checkOut) {
    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
        listing: listingId,
        status: { $in: ['confirmed', 'completed'] },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn }
    });

    if (overlappingBooking) {
        return false;
    }

    // Check blocked dates
    const listing = await Listing.findById(listingId);
    if (listing.blockedDates && listing.blockedDates.length > 0) {
        const blockedInRange = listing.blockedDates.some(blockedDate => {
            const date = new Date(blockedDate);
            return date >= checkIn && date < checkOut;
        });
        if (blockedInRange) {
            return false;
        }
    }

    return true;
}

// Helper function for sort options
function getSortOptions(sort) {
    switch (sort) {
        case 'price-low':
            return { price: 1 };
        case 'price-high':
            return { price: -1 };
        case 'rating':
            return { 'reviews.rating': -1 };
        case 'newest':
            return { createdAt: -1 };
        case 'recommended':
        default:
            return { isFeatured: -1, premiumTier: -1, createdAt: -1 };
    }
}

module.exports = router;