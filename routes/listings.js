const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const Listing = require("../Models/listing.js");
const {isLoggedIn} = require("../middleware.js");
const { generateShareUrl } = require("../utils/shareUtils.js");

const validateListing = (req, res, next) => {
    const {error} = listingSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(","); 
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

// Index Route
router.get("/", wrapAsync(async (req, res) => {
    const { search, minPrice, maxPrice, page = 1, ajax, sort = 'recommended', premium, featured } = req.query;
    const limit = ajax ? 9 : 12; // Fewer listings for AJAX requests
    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } }
        ];
    }

    // Price filtering
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Premium filtering
    if (premium === 'true') {
        query.premiumTier = { $ne: null };
        query.premiumExpiry = { $gt: new Date() };
    }

    // Featured filtering
    if (featured === 'true') {
        query.isFeatured = true;
        query.featuredExpiry = { $gt: new Date() };
    }

    const totalListings = await Listing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limit);

    // Sorting options
    let sortOptions = {};
    switch (sort) {
        case 'price-low':
            sortOptions = { price: 1 };
            break;
        case 'price-high':
            sortOptions = { price: -1 };
            break;
        case 'rating':
            sortOptions = { 'reviews.rating': -1 };
            break;
        case 'newest':
            sortOptions = { createdAt: -1 };
            break;
        case 'featured':
            sortOptions = { isFeatured: -1, createdAt: -1 };
            break;
        case 'premium':
            sortOptions = { premiumTier: -1, createdAt: -1 };
            break;
        case 'recommended':
        default:
            // Prioritize featured listings, then premium, then regular
            sortOptions = { isFeatured: -1, premiumTier: -1, createdAt: -1 };
            break;
    }

    let listings = await Listing.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

    // Debug: Log geometry data
    console.log('Listings geometry:', listings.map(l => ({ id: l._id, geometry: l.geometry })));

    // Fix empty coordinates by setting default
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

    // Return JSON for AJAX requests
    if (ajax) {
        return res.json({
            listings: listings.map(listing => ({
                _id: listing._id,
                title: listing.title,
                image: listing.image,
                price: listing.price,
                location: listing.location,
                country: listing.country,
                isFavorited: listing.isFavorited || false
            })),
            hasMore: parseInt(page) < totalPages
        });
    }

    res.render("listings/index.ejs", {
        listings,
        search,
        minPrice,
        maxPrice,
        currentPage: parseInt(page),
        totalPages,
        sort,
        premium,
        featured
    });
}));

// New Route
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
}); 

// Show Route
router.get("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author"
        }
    }).populate("owner");

    if(!listing){
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Get user's completed bookings for this listing (for review form)
    let userBookings = [];
    if (res.locals.currUser) {
        const Booking = require("../Models/booking.js");
        userBookings = await Booking.find({
            guest: res.locals.currUser._id,
            listing: id,
            status: 'completed'
        }).sort({ checkOut: -1 });
    }

    // Add favorite status for logged-in users
    let isFavorited = false;
    if (res.locals.currUser) {
        const Wishlist = require("../Models/wishlist.js");
        const wishlist = await Wishlist.findOne({ user: res.locals.currUser._id, name: "Favorites" });
        if (wishlist) {
            isFavorited = wishlist.listings.includes(listing._id);
        }
    }

    // Generate share URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const shareUrls = {
        facebook: generateShareUrl('facebook', listing, baseUrl),
        twitter: generateShareUrl('twitter', listing, baseUrl),
        whatsapp: generateShareUrl('whatsapp', listing, baseUrl),
        copy: generateShareUrl('copy', listing, baseUrl)
    };

    // Set listing for meta tags in layout
    res.locals.listing = listing;

    console.log(listing);
    res.render("listings/show.ejs", { listing, userBookings, isFavorited, shareUrls });
}));

// Create Route
router.post("/",isLoggedIn, validateListing, wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id; 
    await newListing.save();
    req.flash("success", "Successfully made a new listing!");
    // res.redirect(`/listings/${newListing._id}`);
    res.redirect("/listings");
}));

// Edit Route
router.get("/:id/edit",isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit this listing");
        return res.redirect(`/listings/${id}`);
    }
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
router.put("/:id",isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit this listing");
        return res.redirect(`/listings/${id}`);
    }
    const updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });
    req.flash("success", "Successfully updated listing!");
    res.redirect(`/listings/${updatedListing._id}`);
}));

// Delete Route
router.delete("/:id",isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to delete this listing");
        return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted listing!");
    res.redirect("/listings");
}));

// Search Autocomplete API
router.get("/api/search-suggestions", wrapAsync(async (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.json({ suggestions: [] });
    }

    // Get title suggestions
    const titleSuggestions = await Listing.find({
        title: { $regex: q, $options: 'i' }
    })
    .select('title')
    .limit(5)
    .distinct('title');

    // Get location suggestions
    const locationSuggestions = await Listing.find({
        $or: [
            { location: { $regex: q, $options: 'i' } },
            { country: { $regex: q, $options: 'i' } }
        ]
    })
    .select('location country')
    .limit(5);

    const locationStrings = locationSuggestions.map(listing =>
        `${listing.location}, ${listing.country}`
    );

    // Combine and deduplicate suggestions
    const allSuggestions = [...new Set([...titleSuggestions, ...locationStrings])]
        .filter(suggestion => suggestion.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8);

    res.json({ suggestions: allSuggestions });
}));

module.exports = router;