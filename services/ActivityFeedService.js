const Activity = require("../Models/activity");
const Follow = require("../Models/follow");

class ActivityFeedService {
    static async getFeedForUser(userId, options = {}) {
        const { page = 1, limit = 20 } = options;

        // Get followed users + self
        const followedUsers = await Follow.find({ follower: userId })
            .select('following')
            .lean();
        const followedIds = followedUsers.map(f => f.following);
        followedIds.push(userId);

        // Build aggregation pipeline
        const pipeline = [
            // Match activities from followed users
            { $match: { actor: { $in: followedIds } } },

            // Sort by creation date
            { $sort: { createdAt: -1 } },

            // Pagination
            { $skip: (page - 1) * limit },
            { $limit: limit },

            // Populate actor with privacy info
            {
                $lookup: {
                    from: 'users',
                    localField: 'actor',
                    foreignField: '_id',
                    as: 'actor'
                }
            },
            { $unwind: '$actor' },

            // Add followers info for privacy checks
            ...(userId ? [{
                $lookup: {
                    let: { actorId: '$actor._id' },
                    pipeline: [
                        { $match: { $expr: { $and: [
                            { $eq: ['$following', '$$actorId'] },
                            { $eq: ['$follower', userId] }
                        ] } } }
                    ],
                    as: 'isFollowedByViewer',
                    from: 'follows'
                }
            }] : []),

            // Filter by privacy
            {
                $match: {
                    $or: [
                        { 'actor.isPrivate': false },  // Public activities
                        { 'actor._id': userId },       // Own activities
                        { 'isFollowedByViewer.0': { $exists: true } }  // Followed private users
                    ]
                }
            },

            // Populate target based on targetModel
            {
                $lookup: {
                    from: 'listings',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'targetData'
                }
            },
            // Additional lookups for other target types
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'bookingData'
                }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'reviewData'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            {
                $lookup: {
                    from: 'wishlists',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'wishlistData'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    localField: 'target',
                    foreignField: '_id',
                    as: 'messageData'
                }
            }
        ];

        const activities = await Activity.aggregate(pipeline);

        // Process the results to combine target data
        return activities.map(activity => {
            let targetData = null;
            switch (activity.targetModel) {
                case 'Listing':
                    targetData = activity.targetData[0];
                    break;
                case 'Booking':
                    targetData = activity.bookingData[0];
                    break;
                case 'Review':
                    targetData = activity.reviewData[0];
                    break;
                case 'User':
                    targetData = activity.userData[0];
                    break;
                case 'Wishlist':
                    targetData = activity.wishlistData[0];
                    break;
                case 'Message':
                    targetData = activity.messageData[0];
                    break;
            }

            return {
                ...activity,
                targetData
            };
        });
    }

    static async getActivitiesForUser(userId, options = {}) {
        const { page = 1, limit = 10 } = options;

        return await Activity.find({ actor: userId })
            .populate('actor', 'username email isPrivate avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
    }
}

module.exports = ActivityFeedService;