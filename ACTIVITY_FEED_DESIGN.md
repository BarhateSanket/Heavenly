# User Activity Feed System Design Document

## Overview
This document outlines the design for a user activity feed system in the Heavenly Airbnb clone. The system will track user activities across the platform and display them in a personalized feed for followers, enhancing user engagement and social features.

## Architecture Overview

### System Components
1. **Activity Model** - Database schema for storing activities
2. **Activity Generation Hooks** - Automatic activity creation on model changes
3. **Feed Aggregation Service** - Logic for collecting and filtering activities
4. **API Endpoints** - RESTful endpoints for feed data
5. **UI Components** - Frontend views and components
6. **Privacy Controls** - Visibility management based on user settings

## 1. Database Schema

### Activity Model (`Models/activity.js`)

```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    actor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: [
            'listing_created',
            'review_posted',
            'booking_made',
            'booking_confirmed',
            'booking_cancelled',
            'user_followed',
            'wishlist_added',
            'message_sent'
        ],
        required: true
    },
    target: {
        type: Schema.Types.ObjectId,
        required: true,
        // Can reference Listing, Booking, Review, User, Wishlist, Message
    },
    targetModel: {
        type: String,
        enum: ['Listing', 'Booking', 'Review', 'User', 'Wishlist', 'Message'],
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        index: true
    }
});

// Compound indexes for efficient queries
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

// Virtual for checking visibility
activitySchema.virtual('isVisibleTo').get(function(viewerId) {
    // Implementation in methods below
});

activitySchema.methods.isVisibleTo = function(viewerId) {
    const viewer = viewerId;
    const actor = this.actor;

    // Always visible to self
    if (viewer && viewer.equals(actor)) {
        return true;
    }

    // Check actor's privacy setting
    // This will be populated when querying
    if (this.actor.isPrivate) {
        // Only followers can see private users' activities
        return viewer && this.actor.followers && this.actor.followers.includes(viewer);
    }

    // Public activities visible to all logged-in users
    return !!viewer;
};

module.exports = mongoose.model("Activity", activitySchema);
```

### Activity Types and Metadata

| Type | Target Model | Metadata Fields | Description |
|------|-------------|-----------------|-------------|
| `listing_created` | Listing | `{title, location}` | User created a new listing |
| `review_posted` | Review | `{listingTitle, rating}` | User posted a review |
| `booking_made` | Booking | `{listingTitle, checkIn, checkOut}` | User made a booking request |
| `booking_confirmed` | Booking | `{listingTitle, guestName}` | Host confirmed a booking |
| `booking_cancelled` | Booking | `{listingTitle, reason?}` | Booking was cancelled |
| `user_followed` | User | `{followedUserName}` | User followed another user |
| `wishlist_added` | Wishlist | `{listingTitle, wishlistName}` | User added listing to wishlist |
| `message_sent` | Message | `{recipientName}` | User sent a message |

## 2. Activity Generation Hooks

### Hook Implementation Pattern

```javascript
// Example: Listing model hook
listingSchema.post('save', async function(doc) {
    if (doc.isNew) {  // Only for new documents
        const Activity = require('./activity');
        await Activity.create({
            actor: doc.owner,
            type: 'listing_created',
            target: doc._id,
            targetModel: 'Listing',
            metadata: {
                title: doc.title,
                location: doc.location
            }
        });
    }
});
```

### Hooks to Implement

#### Listing Model (`Models/listing.js`)
- **Post-save hook**: Create `listing_created` activity for new listings

#### Booking Model (`Models/booking.js`)
- **Post-save hook**: Create `booking_made` activity for new bookings
- **Pre-save hook**: Track status changes and create `booking_confirmed`/`booking_cancelled` activities

#### Review Model (`Models/review.js`)
- **Post-save hook**: Create `review_posted` activity for new reviews

#### Follow Model (`Models/follow.js`)
- **Post-save hook**: Create `user_followed` activity

#### Wishlist Model (`Models/wishlist.js`)
- **Post-save hook**: Create `wishlist_added` activity when items are added

#### Message Model (`Models/message.js`)
- **Post-save hook**: Create `message_sent` activity

## 3. Feed Aggregation Logic

### Core Feed Query Service

```javascript
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
                    from: 'follows',
                    let: { actorId: '$actor._id' },
                    pipeline: [
                        { $match: { $expr: { $and: [
                            { $eq: ['$following', '$$actorId'] },
                            { $eq: ['$follower', userId] }
                        ] } } }
                    ],
                    as: 'isFollowedByViewer'
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
                    from: 'listings',  // Will be dynamic based on targetModel
                    localField: 'target',
                    foreignField: '_id',
                    as: 'targetData'
                }
            }
            // Additional lookups for other target types...
        ];

        return await Activity.aggregate(pipeline);
    }
}
```

### Feed Query Features
- **Pagination**: Page-based with configurable limit
- **Privacy Filtering**: Respects user privacy settings
- **Target Population**: Dynamically populates target data based on type
- **Sorting**: Chronological (newest first)
- **Performance**: Uses aggregation pipeline for efficiency

## 4. UI Components

### Main Feed Page (`views/activities/feed.ejs`)

```ejs
<% layout("layouts/boilerplate") %>

<div class="container mt-4">
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <h1 class="mb-4">Activity Feed</h1>

            <div id="activity-feed">
                <% activities.forEach(activity => { %>
                    <div class="card mb-3 activity-item" data-activity-id="<%= activity._id %>">
                        <div class="card-body">
                            <div class="d-flex align-items-start">
                                <img src="<%= activity.actor.avatar || '/default-avatar.png' %>"
                                     class="rounded-circle me-3"
                                     width="40" height="40" alt="Avatar">
                                <div class="flex-grow-1">
                                    <p class="mb-1">
                                        <strong><%= activity.actor.username || activity.actor.email %></strong>
                                        <%= getActivityText(activity) %>
                                        <small class="text-muted">
                                            <%= timeAgo(activity.createdAt) %>
                                        </small>
                                    </p>
                                    <% if (activity.targetData && activity.targetData.length > 0) { %>
                                        <div class="activity-target">
                                            <%= renderActivityTarget(activity) %>
                                        </div>
                                    <% } %>
                                </div>
                            </div>
                        </div>
                    </div>
                <% }) %>
            </div>

            <% if (hasMore) { %>
                <div class="text-center mt-4">
                    <button id="load-more" class="btn btn-outline-primary">
                        Load More Activities
                    </button>
                </div>
            <% } %>
        </div>
    </div>
</div>

<script src="/js/activity-feed.js"></script>
```

### Activity Item Partial (`views/includes/activity-item.ejs`)

```ejs
<div class="activity-item">
    <div class="activity-header">
        <img src="<%= activity.actor.avatar %>" class="activity-avatar">
        <div class="activity-content">
            <span class="activity-actor"><%= activity.actor.username %></span>
            <span class="activity-action"><%= activity.actionText %></span>
            <span class="activity-target">
                <a href="<%= activity.targetUrl %>"><%= activity.targetText %></a>
            </span>
        </div>
        <time class="activity-time"><%= activity.timeAgo %></time>
    </div>
    <% if (activity.preview) { %>
        <div class="activity-preview">
            <%= activity.preview %>
        </div>
    <% } %>
</div>
```

### Helper Functions

```javascript
// In utils/activityHelpers.js
function getActivityText(activity) {
    const templates = {
        'listing_created': 'created a new listing',
        'review_posted': 'posted a review for',
        'booking_made': 'made a booking for',
        'booking_confirmed': 'confirmed a booking for',
        'booking_cancelled': 'cancelled a booking for',
        'user_followed': 'started following',
        'wishlist_added': 'added to wishlist',
        'message_sent': 'sent a message to'
    };
    return templates[activity.type] || 'performed an action';
}

function renderActivityTarget(activity) {
    const target = activity.targetData[0];
    switch (activity.type) {
        case 'listing_created':
            return `<a href="/listings/${target._id}">${target.title}</a>`;
        case 'review_posted':
            return `<a href="/listings/${target.listing._id}#review-${target._id}">a listing</a>`;
        // ... other cases
    }
}
```

## 5. API Endpoints

### Routes (`routes/activities.js`)

```javascript
const express = require("express");
const router = express.Router();
const Activity = require("../models/activity");
const ActivityFeedService = require("../services/ActivityFeedService");
const { isLoggedIn } = require("../middleware");

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
                target: activity.targetData[0] || null,
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

        res.json({ activities });
    } catch (error) {
        console.error('User activities API error:', error);
        res.status(500).json({ error: 'Unable to load activities' });
    }
});

module.exports = router;
```

### API Response Format

```json
{
    "activities": [
        {
            "id": "60f1b2b3c4d5e6f7g8h9i0j1",
            "type": "listing_created",
            "actor": {
                "id": "60f1b2b3c4d5e6f7g8h9i0j2",
                "username": "john_doe",
                "avatar": "/uploads/avatars/john.jpg"
            },
            "target": {
                "_id": "60f1b2b3c4d5e6f7g8h9i0j3",
                "title": "Cozy Mountain Cabin",
                "image": "/uploads/listings/cabin.jpg"
            },
            "metadata": {
                "title": "Cozy Mountain Cabin",
                "location": "Aspen, CO"
            },
            "createdAt": "2023-07-15T10:30:00Z",
            "timeAgo": "2 hours ago"
        }
    ],
    "hasMore": true
}
```

## 6. Privacy Controls

### Privacy Logic Implementation

```javascript
// In ActivityFeedService
static async getFeedForUser(userId, options = {}) {
    // Get followed users
    const followedUsers = await Follow.find({ follower: userId })
        .select('following')
        .lean();
    const followedIds = followedUsers.map(f => f.following);
    followedIds.push(userId); // Include self

    // Build privacy-aware query
    const matchConditions = {
        actor: { $in: followedIds }
    };

    // If user is logged in, apply privacy filters
    if (userId) {
        matchConditions.$or = [
            { 'actor.isPrivate': false },  // Public activities
            { actor: userId },             // Own activities
            {                            // Activities from followed private users
                'actor.isPrivate': true,
                'actor._id': { $in: followedIds }
            }
        ];
    } else {
        // Anonymous users only see public activities
        matchConditions['actor.isPrivate'] = false;
    }

    return await Activity.find(matchConditions)
        .populate('actor', 'username email isPrivate avatar')
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .lean();
}
```

### Privacy Rules Summary

| Actor Privacy | Viewer Relationship | Visibility |
|---------------|---------------------|------------|
| Public | Any logged-in user | Visible |
| Public | Anonymous | Visible |
| Private | Self | Visible |
| Private | Follower | Visible |
| Private | Non-follower | Hidden |
| Private | Anonymous | Hidden |

## 7. Implementation Steps

### Phase 1: Core Infrastructure
1. **Create Activity Model** (`Models/activity.js`)
   - Define schema with all required fields
   - Add indexes for performance
   - Create model file

2. **Create Activity Service** (`services/ActivityFeedService.js`)
   - Implement feed aggregation logic
   - Add privacy filtering
   - Create helper methods

3. **Add Activity Generation Hooks**
   - Update `Models/listing.js` with post-save hook
   - Update `Models/booking.js` with status change hooks
   - Update `Models/review.js` with post-save hook
   - Update `Models/follow.js` with post-save hook
   - Update other models as needed

### Phase 2: API and Routes
4. **Create Activity Routes** (`routes/activities.js`)
   - Implement feed endpoint
   - Add API endpoints for AJAX loading
   - Include privacy checks

5. **Update Main App** (`app.js`)
   - Add activity routes to app
   - Import and mount routes

6. **Update API Routes** (`routes/api.js`)
   - Add activity-related API endpoints
   - Ensure proper authentication

### Phase 3: Frontend Implementation
7. **Create Activity Views**
   - `views/activities/feed.ejs` - Main feed page
   - `views/includes/activity-item.ejs` - Activity item partial
   - Add helper functions for activity text generation

8. **Update Navigation** (`views/includes/navbar.ejs`)
   - Add "Activity Feed" link
   - Position appropriately in navigation

9. **Add Client-side JavaScript** (`Public/js/activity-feed.js`)
   - Implement infinite scroll
   - Add AJAX loading for better UX
   - Handle real-time updates if needed

### Phase 4: Testing and Optimization
10. **Add Tests** (`tests/activities.test.js`)
    - Unit tests for Activity model
    - Integration tests for feed service
    - API endpoint tests

11. **Performance Optimization**
    - Add database indexes
    - Implement caching if needed
    - Optimize aggregation queries

12. **UI/UX Polish**
    - Add loading states
    - Implement error handling
    - Add empty states
    - Test responsive design

## 8. Technical Specifications

### Performance Requirements
- **Feed Load Time**: < 500ms for first page
- **Pagination**: Support for 1000+ activities per user
- **Concurrent Users**: Handle 100+ simultaneous feed requests
- **Database Queries**: Minimize N+1 queries with proper population

### Security Considerations
- **Privacy Enforcement**: Server-side privacy checks only
- **Input Validation**: Validate all activity metadata
- **Rate Limiting**: Prevent activity spam
- **Authentication**: All feed endpoints require authentication

### Scalability Considerations
- **Database Indexes**: Compound indexes on (actor, createdAt)
- **Query Optimization**: Use aggregation pipelines for complex queries
- **Caching Strategy**: Redis for frequently accessed feeds
- **Archive Strategy**: Move old activities to archive collection

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for all screen sizes
- **Progressive Enhancement**: Core functionality works without JavaScript

## 9. Dependencies and Libraries

### Backend Dependencies
- **mongoose**: MongoDB ODM (already included)
- **express**: Web framework (already included)
- **passport**: Authentication (already included)

### Frontend Dependencies
- **Bootstrap 5**: UI framework (already included)
- **jQuery**: DOM manipulation (if needed)
- **Timeago.js**: Relative time formatting

### Development Dependencies
- **Jest**: Testing framework (already included)
- **Supertest**: API testing

## 10. Migration Strategy

### Database Migration
Since MongoDB is schema-less, no migration scripts needed. The Activity collection will be created automatically when first activity is saved.

### Backward Compatibility
- Existing user data remains unchanged
- New features are additive
- Privacy settings work with existing user profiles

### Rollback Plan
- Remove activity routes from app.js
- Drop Activity collection if needed
- Remove activity-related UI elements

## Conclusion

This activity feed system will significantly enhance the social features of the Heavenly platform, encouraging user engagement through visible activity tracking. The design prioritizes privacy, performance, and scalability while maintaining consistency with the existing codebase architecture.

The modular design allows for easy extension with new activity types and features as the platform grows.