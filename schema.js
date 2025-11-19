const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        country: Joi.string().required(),
        image: Joi.string().allow("", null),
        maxGuests: Joi.number().integer().min(1).required(),
        geometry: Joi.object({
            type: Joi.string().valid('Point').required(),
            coordinates: Joi.array().items(Joi.number()).length(2).required()
        }).required(),
        isFeatured: Joi.boolean().optional(),
        premiumTier: Joi.string().valid('basic', 'premium', 'gold').allow(null).optional(),
        featuredExpiry: Joi.date().allow(null).optional(),
        premiumExpiry: Joi.date().allow(null).optional(),
        premiumActivatedAt: Joi.date().allow(null).optional()
    }).required()
});

const reviewSchema = Joi.object({
    review: Joi.object({
        comment: Joi.string().required(),
        rating: Joi.number().required().min(1).max(5),
        detailedRatings: Joi.object({
            cleanliness: Joi.number().min(1).max(5).required(),
            accuracy: Joi.number().min(1).max(5).required(),
            communication: Joi.number().min(1).max(5).required(),
            location: Joi.number().min(1).max(5).required(),
            checkIn: Joi.number().min(1).max(5).required(),
            value: Joi.number().min(1).max(5).required()
        }).required(),
        booking: Joi.string().required()
    }).required()
});

const hostResponseSchema = Joi.object({
    response: Joi.string().required().min(1).max(1000).trim()
});

const reportReviewSchema = Joi.object({
    reason: Joi.string().required().valid('inappropriate', 'spam', 'fake', 'offensive', 'other')
});

const moderateReviewSchema = Joi.object({
    action: Joi.string().required().valid('approve', 'remove')
});

const bookingSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().required(),
        checkOut: Joi.date().required(),
        guests: Joi.number().integer().min(1).required(),
    }).required()
});

const messageSchema = Joi.object({
    message: Joi.object({
        content: Joi.string().required().min(1).max(1000).trim(),
    }).required()
});

const conversationSchema = Joi.object({
    conversation: Joi.object({
        listingId: Joi.string().required(),
        recipientId: Joi.string().required(),
        initialMessage: Joi.string().required().min(1).max(1000).trim(),
    }).required()
});

const commentSchema = Joi.object({
    comment: Joi.object({
        content: Joi.string().required().min(1).max(1000).trim(),
        parent: Joi.string().optional()
    }).required()
});

const reportCommentSchema = Joi.object({
    reason: Joi.string().required().valid('inappropriate', 'spam', 'fake', 'offensive', 'other')
});

const moderateCommentSchema = Joi.object({
    action: Joi.string().required().valid('approve', 'remove')
});

const premiumUpgradeSchema = Joi.object({
    tier: Joi.string().valid('basic', 'premium', 'gold').required(),
    duration: Joi.number().integer().min(1).max(365).required()
});

const premiumManagementSchema = Joi.object({
    listingId: Joi.string().required(),
    action: Joi.string().valid('activate', 'deactivate', 'extend').required(),
    tier: Joi.string().valid('basic', 'premium', 'gold').optional(),
    expiry: Joi.date().optional()
});


module.exports = {listingSchema, reviewSchema, bookingSchema, messageSchema, conversationSchema, hostResponseSchema, reportReviewSchema, moderateReviewSchema, commentSchema, reportCommentSchema, moderateCommentSchema, premiumUpgradeSchema, premiumManagementSchema};
