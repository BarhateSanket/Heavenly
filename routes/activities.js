const express = require("express");
const router = express.Router();
const Activity = require("../Models/activity");
const ActivityFeedService = require("../services/ActivityFeedService");
const User = require("../Models/user");
const { isLoggedIn } = require("../middleware");
const { getTimeAgo } = require("../utils/activityHelpers");

// Get activity feed for current user
router.get("/feed", isLoggedIn, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const activities = await ActivityFeedService.getFeedForUser(
            req.user._id,
            { page: parseInt(page), limit: parseInt(limit) }
        );

        const hasMore = activities.length === parseInt(limit);

        res.render("activities/feed", {
            activities,
            currentPage: parseInt(page),
            hasMore
        });
    } catch (error) {
        console.error('Feed error:', error);
        req.flash("error", "Unable to load activity feed");
        res.redirect("/");
    }
});

// API endpoint for AJAX feed loading
router.get("/api/feed", isLoggedIn, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const activities = await ActivityFeedService.getFeedForUser(
            req.user._id,
            { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json({
            activities: activities.map(activity => ({
                id: activity._id,
                type: activity.type,
                actor: {
                    id: activity.actor._id,
                    username: activity.actor.username,
                    avatar: activity.actor.avatar
                },
                target: activity.targetData || null,
                metadata: activity.metadata,
                createdAt: activity.createdAt,
                timeAgo: getTimeAgo(activity.createdAt)
            })),
            hasMore: activities.length === parseInt(limit)
        });
    } catch (error) {
        console.error('API feed error:', error);
        res.status(500).json({ error: 'Unable to load feed' });
    }
});

// Get activities for a specific user (with privacy checks)
router.get("/api/user/:userId", isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Check if viewer can see this user's activities
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        let canView = !targetUser.isPrivate;
        if (targetUser.isPrivate) {
            const Follow = require("../Models/follow");
            const follow = await Follow.findOne({
                follower: req.user._id,
                following: userId
            });
            canView = !!follow;
        }

        if (!canView && !req.user._id.equals(userId)) {
            return res.status(403).json({ error: 'Private profile' });
        }

        const activities = await ActivityFeedService.getActivitiesForUser(
            userId,
            { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json({
            activities: activities.map(activity => ({
                id: activity._id,
                type: activity.type,
                actor: {
                    id: activity.actor._id,
                    username: activity.actor.username,
                    avatar: activity.actor.avatar
                },
                target: activity.targetData || null,
                metadata: activity.metadata,
                createdAt: activity.createdAt,
                timeAgo: getTimeAgo(activity.createdAt)
            }))
        });
    } catch (error) {
        console.error('User activities API error:', error);
        res.status(500).json({ error: 'Unable to load activities' });
    }
});

module.exports = router;