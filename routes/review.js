const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {reviewSchema, hostResponseSchema, reportReviewSchema} = require("../schema.js");
const Listing = require("../Models/listing.js");
const Review = require("../Models/review.js");
const Booking = require("../Models/booking.js");
const {isLoggedIn, isAdmin, verifyBooking} = require("../middleware.js");
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Setup multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ExpressError('Only image files are allowed!', 400), false);
        }
    }
});



const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

const validateHostResponse = (req, res, next) => {
    const {error} = hostResponseSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

const validateReport = (req, res, next) => {
    const {error} = reportReviewSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}


// Review Route Post
router.post("/", isLoggedIn, upload.array('photos', 5), validateReview, verifyBooking, wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let review = new Review(req.body.review);
    review.author = req.user._id;
    review.booking = req.body.review.booking;
    review.verified = true; // Since booking is verified

    // Process photos
    if (req.files && req.files.length > 0) {
        const uploadDir = path.join(__dirname, '..', 'Public', 'uploads', 'reviews');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const photoPaths = [];
        for (let file of req.files) {
            const filename = `review_${review._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            const filepath = path.join(uploadDir, filename);

            await sharp(file.buffer)
                .resize(800, 600, { fit: 'inside' })
                .jpeg({ quality: 80 })
                .toFile(filepath);

            photoPaths.push(`/uploads/reviews/${filename}`);
        }
        review.photos = photoPaths;
    }

    listing.reviews.push(review);
    await review.save();
    await listing.save();
    req.flash("success", "Successfully added a review!");
    res.redirect(`/listings/${listing._id}`);
}));
// Delete Route Review
router.delete("/:reviewId", isLoggedIn, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to delete this review");
        return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Successfully deleted review!");
    res.redirect(`/listings/${id}`);
}));

// Host Response Route
router.post("/:reviewId/response", isLoggedIn, validateHostResponse, wrapAsync(async (req, res) => {
    const { reviewId } = req.params;
    const { response } = req.body;
    const review = await Review.findById(reviewId).populate({ path: 'listing', select: 'owner' });

    if (!review.listing.owner.equals(req.user._id)) {
        req.flash("error", "Only the listing owner can respond to reviews");
        return res.redirect(`/listings/${review.listing._id}`);
    }

    review.hostResponse = {
        response: response,
        respondedAt: new Date(),
        respondedBy: req.user._id
    };

    await review.save();
    req.flash("success", "Response added successfully!");
    res.redirect(`/listings/${review.listing._id}`);
}));

// Report Review Route
router.post("/:reviewId/report", isLoggedIn, validateReport, wrapAsync(async (req, res) => {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const review = await Review.findById(reviewId);

    // Check if user already reported
    const alreadyReported = review.reports.some(report => report.reportedBy.equals(req.user._id));
    if (alreadyReported) {
        req.flash("error", "You have already reported this review");
        return res.redirect(`/listings/${req.params.id}`);
    }

    review.reports.push({
        reason: reason,
        reportedBy: req.user._id
    });

    await review.save();
    req.flash("success", "Review reported successfully!");
    res.redirect(`/listings/${req.params.id}`);
}));


module.exports = router;
