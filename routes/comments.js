const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {commentSchema, reportCommentSchema, moderateCommentSchema} = require("../schema.js");
const Listing = require("../Models/listing.js");
const Comment = require("../Models/comment.js");
const {isLoggedIn, isAdmin} = require("../middleware.js");

const validateComment = (req, res, next) => {
    const {error} = commentSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

const validateReport = (req, res, next) => {
    const {error} = reportCommentSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

const validateModerate = (req, res, next) => {
    const {error} = moderateCommentSchema.validate(req.body);
    if(error){
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

// Get comments for a listing (AJAX endpoint)
router.get("/", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }

    // Get top-level comments with pagination
    const comments = await Comment.find({
        listing: id,
        parent: null
    })
    .populate('author', 'username')
    .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username' }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalComments = await Comment.countDocuments({
        listing: id,
        parent: null
    });

    res.json({
        comments: comments,
        hasMore: parseInt(page) * limit < totalComments,
        total: totalComments
    });
}));

// Create comment
router.post("/", isLoggedIn, validateComment, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { content, parent } = req.body.comment;

    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }

    const comment = new Comment({
        content,
        listing: id,
        author: req.user._id,
        parent: parent || null
    });

    await comment.save();

    // Add to listing's comments array
    listing.comments.push(comment._id);
    await listing.save();

    // If it's a reply, add to parent's replies array
    if (parent) {
        await Comment.findByIdAndUpdate(parent, {
            $push: { replies: comment._id }
        });
    }

    // Populate author for response
    await comment.populate('author', 'username');

    req.flash("success", "Comment added successfully!");
    res.json({ comment });
}));

// Update comment
router.put("/:commentId", isLoggedIn, validateComment, wrapAsync(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body.comment;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ExpressError("Comment not found", 404);
    }

    if (!comment.author.equals(req.user._id)) {
        throw new ExpressError("You don't have permission to edit this comment", 403);
    }

    comment.content = content;
    await comment.save();

    await comment.populate('author', 'username');

    req.flash("success", "Comment updated successfully!");
    res.json({ comment });
}));

// Delete comment
router.delete("/:commentId", isLoggedIn, wrapAsync(async (req, res) => {
    const { id, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ExpressError("Comment not found", 404);
    }

    if (!comment.author.equals(req.user._id)) {
        throw new ExpressError("You don't have permission to delete this comment", 403);
    }

    // Remove from listing's comments array
    await Listing.findByIdAndUpdate(id, {
        $pull: { comments: commentId }
    });

    // Delete the comment (middleware will handle replies cleanup)
    await Comment.findByIdAndDelete(commentId);

    req.flash("success", "Comment deleted successfully!");
    res.json({ success: true });
}));

// Report comment
router.post("/:commentId/report", isLoggedIn, validateReport, wrapAsync(async (req, res) => {
    const { commentId } = req.params;
    const { reason } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ExpressError("Comment not found", 404);
    }

    // Check if user already reported
    const alreadyReported = comment.reports.some(report => report.reportedBy.equals(req.user._id));
    if (alreadyReported) {
        req.flash("error", "You have already reported this comment");
        return res.redirect(`/listings/${req.params.id}`);
    }

    comment.reports.push({
        reason,
        reportedBy: req.user._id
    });

    await comment.save();
    req.flash("success", "Comment reported successfully!");
    res.redirect(`/listings/${req.params.id}`);
}));

// Moderate comment (Admin only)
router.post("/:commentId/moderate", isLoggedIn, isAdmin, validateModerate, wrapAsync(async (req, res) => {
    const { commentId } = req.params;
    const { action } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ExpressError("Comment not found", 404);
    }

    if (action === 'remove') {
        // Remove from listing's comments array
        await Listing.findByIdAndUpdate(comment.listing, {
            $pull: { comments: commentId }
        });
        // Delete the comment
        await Comment.findByIdAndDelete(commentId);
        req.flash("success", "Comment removed successfully!");
    } else if (action === 'approve') {
        comment.moderated = false;
        comment.reports = []; // Clear reports
        await comment.save();
        req.flash("success", "Comment approved successfully!");
    }

    res.redirect("/admin/comments");
}));

module.exports = router;