const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isAdmin} = require("../middleware.js");
const Review = require("../Models/review.js");
const Comment = require("../Models/comment.js");
const Listing = require("../Models/listing.js");
const {moderateReviewSchema, moderateCommentSchema} = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");

const validateModerate = (req, res, next) => {
    const {error} = moderateReviewSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

const validateModerateComment = (req, res, next) => {
    const {error} = moderateCommentSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

// Admin dashboard
router.get("/", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    const stats = {
        totalReviews: await Review.countDocuments(),
        reportedReviews: await Review.countDocuments({ 'reports.0': { $exists: true } }),
        moderatedReviews: await Review.countDocuments({ moderated: true }),
        totalComments: await Comment.countDocuments(),
        reportedComments: await Comment.countDocuments({ 'reports.0': { $exists: true } }),
        moderatedComments: await Comment.countDocuments({ moderated: true }),
        totalListings: await Listing.countDocuments(),
        totalPremium: await Listing.countDocuments({ premiumTier: { $ne: null } }),
        activePremium: await Listing.countDocuments({ premiumExpiry: { $gt: new Date() } }),
        featuredListings: await Listing.countDocuments({ isFeatured: true })
    };

    res.render("admin/dashboard", { stats });
}));

// Review moderation page
router.get("/reviews", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    const reviews = await Review.find({ 'reports.0': { $exists: true } })
        .populate('author')
        .populate('listing')
        .populate('reports.reportedBy')
        .sort({ 'reports.0.reportedAt': -1 });

    res.render("admin/reviews", { reviews });
}));

// Moderate review
router.put("/reviews/:reviewId", isLoggedIn, isAdmin, validateModerate, wrapAsync(async (req, res) => {
    const { reviewId } = req.params;
    const { action } = req.body;

    if (action === 'remove') {
        const review = await Review.findById(reviewId);
        await Listing.findByIdAndUpdate(review.listing, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash("success", "Review removed successfully!");
    } else if (action === 'approve') {
        await Review.findByIdAndUpdate(reviewId, { moderated: true, $unset: { reports: [] } });
        req.flash("success", "Review approved and reports cleared!");
    }

    res.redirect("/admin/reviews");
}));

// Comment moderation page
router.get("/comments", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    const comments = await Comment.find({ 'reports.0': { $exists: true } })
        .populate('author')
        .populate('listing')
        .populate('reports.reportedBy')
        .sort({ 'reports.0.reportedAt': -1 });

    res.render("admin/comments", { comments });
}));

module.exports = router;