const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    replies: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }],
    reports: [{
        reason: {
            type: String,
            enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other'],
            required: true
        },
        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    moderated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
commentSchema.index({ listing: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ author: 1 });

// Middleware to update updatedAt on save
commentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Middleware to handle replies cleanup on delete
commentSchema.post("findOneAndDelete", async function(comment) {
    if (comment) {
        // Remove this comment from parent's replies array
        if (comment.parent) {
            await mongoose.model('Comment').updateOne(
                { _id: comment.parent },
                { $pull: { replies: comment._id } }
            );
        }
        // Delete all replies recursively
        await mongoose.model('Comment').deleteMany({ parent: comment._id });
    }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;