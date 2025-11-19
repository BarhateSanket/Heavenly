const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { premiumUpgradeSchema, premiumManagementSchema } = require("../schema.js");
const Listing = require("../Models/listing.js");
const { isLoggedIn, isAdmin } = require("../middleware.js");

const validatePremiumUpgrade = (req, res, next) => {
    const { error } = premiumUpgradeSchema.validate(req.body);
    if (error) {
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

const validatePremiumManagement = (req, res, next) => {
    const { error } = premiumManagementSchema.validate(req.body);
    if (error) {
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

// Check if user owns the listing
const isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to manage this listing");
        return res.redirect(`/listings/${id}`);
    }
    req.listing = listing;
    next();
};

// Upgrade form for listing owners
router.get("/upgrade/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const listing = req.listing;
    res.render("premium/upgrade.ejs", { listing });
}));

// Process premium upgrade
router.post("/upgrade/:id", isLoggedIn, isOwner, validatePremiumUpgrade, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { tier, duration } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Calculate expiry dates
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + duration);

    // Update listing with premium details
    listing.premiumTier = tier;
    listing.premiumExpiry = expiryDate;
    listing.premiumActivatedAt = now;

    // Set featured based on tier
    if (tier === 'gold') {
        listing.isFeatured = true;
        listing.featuredExpiry = expiryDate;
    } else if (tier === 'premium') {
        listing.isFeatured = true;
        listing.featuredExpiry = expiryDate;
    } else {
        listing.isFeatured = false;
    }

    await listing.save();

    req.flash("success", `Successfully upgraded listing to ${tier} tier!`);
    res.redirect(`/listings/${id}`);
}));

// Admin premium dashboard
router.get("/admin", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    const { page = 1, filter = 'all' } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (filter === 'active') {
        query.premiumExpiry = { $gt: new Date() };
    } else if (filter === 'expired') {
        query.premiumExpiry = { $lte: new Date() };
    } else if (filter === 'featured') {
        query.isFeatured = true;
    }

    const totalListings = await Listing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limit);

    const listings = await Listing.find(query)
        .populate('owner')
        .sort({ premiumActivatedAt: -1 })
        .skip(skip)
        .limit(limit);

    // Statistics
    const stats = {
        totalPremium: await Listing.countDocuments({ premiumTier: { $ne: null } }),
        activePremium: await Listing.countDocuments({ premiumExpiry: { $gt: new Date() } }),
        featuredListings: await Listing.countDocuments({ isFeatured: true }),
        expiredPremium: await Listing.countDocuments({
            premiumTier: { $ne: null },
            premiumExpiry: { $lte: new Date() }
        })
    };

    res.render("admin/premium.ejs", {
        listings,
        stats,
        currentPage: parseInt(page),
        totalPages,
        filter
    });
}));

// Admin manage premium for a listing
router.post("/admin/:id", isLoggedIn, isAdmin, validatePremiumManagement, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { action, tier, expiry } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/admin/premium");
    }

    switch (action) {
        case 'activate':
            if (tier) {
                listing.premiumTier = tier;
                listing.premiumActivatedAt = new Date();
                if (tier === 'gold' || tier === 'premium') {
                    listing.isFeatured = true;
                    listing.featuredExpiry = expiry ? new Date(expiry) : listing.premiumExpiry;
                }
            }
            break;
        case 'deactivate':
            listing.premiumTier = null;
            listing.premiumExpiry = null;
            listing.premiumActivatedAt = null;
            listing.isFeatured = false;
            listing.featuredExpiry = null;
            break;
        case 'extend':
            if (expiry) {
                listing.premiumExpiry = new Date(expiry);
                if (listing.isFeatured) {
                    listing.featuredExpiry = new Date(expiry);
                }
            }
            break;
    }

    await listing.save();

    req.flash("success", `Successfully ${action}d premium for listing`);
    res.redirect("/premium/admin");
}));

module.exports = router;