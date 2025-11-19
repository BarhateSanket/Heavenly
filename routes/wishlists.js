const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Wishlist = require("../Models/wishlist.js");
const Listing = require("../Models/listing.js");
const User = require("../Models/user");
const { isLoggedIn } = require("../middleware.js");

// Middleware to check if user owns the wishlist
const isWishlistOwner = async (req, res, next) => {
    const { id } = req.params;
    const wishlist = await Wishlist.findById(id);
    if (!wishlist) {
        req.flash("error", "Wishlist not found!");
        return res.redirect("/wishlists");
    }
    if (!wishlist.user.equals(req.user._id)) {
        req.flash("error", "You don't have permission to access this wishlist");
        return res.redirect("/wishlists");
    }
    req.wishlist = wishlist;
    next();
};

// Index - Show user's wishlists
router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
    const wishlists = await Wishlist.find({ user: req.user._id }).populate("listings");
    res.render("wishlists/index.ejs", { wishlists });
}));

// Show - Display specific wishlist
router.get("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const wishlist = await Wishlist.findById(id).populate({
        path: "listings",
        populate: { path: "owner" }
    }).populate("user");

    if (!wishlist) {
        req.flash("error", "Wishlist not found!");
        return res.redirect("/wishlists");
    }

    // Check privacy
    if (wishlist.isPrivate && !wishlist.user.equals(req.user._id)) {
        req.flash("error", "This wishlist is private");
        return res.redirect("/wishlists");
    }

    res.render("wishlists/show.ejs", { wishlist });
}));

// Create - New wishlist form
router.get("/new", isLoggedIn, (req, res) => {
    res.render("wishlists/new.ejs");
});

// Create - Handle new wishlist
router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
    const { name, isPrivate } = req.body.wishlist;
    const wishlist = new Wishlist({
        name,
        user: req.user._id,
        isPrivate: isPrivate === 'on'
    });
    await wishlist.save();

    // Add to user's wishlists
    await User.findByIdAndUpdate(req.user._id, { $push: { wishlists: wishlist._id } });

    req.flash("success", "Wishlist created successfully!");
    res.redirect(`/wishlists/${wishlist._id}`);
}));

// Update - Handle privacy settings
router.put("/:id/privacy", isLoggedIn, isWishlistOwner, wrapAsync(async (req, res) => {
    const { isPrivate } = req.body;
    await Wishlist.findByIdAndUpdate(req.wishlist._id, { isPrivate: isPrivate === 'true' });
    req.flash("success", "Privacy settings updated!");
    res.json({ success: true });
}));

// Delete - Remove wishlist
router.delete("/:id", isLoggedIn, isWishlistOwner, wrapAsync(async (req, res) => {
    await Wishlist.findByIdAndDelete(req.wishlist._id);
    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlists: req.wishlist._id } });
    req.flash("success", "Wishlist deleted successfully!");
    res.redirect("/wishlists");
}));

module.exports = router;