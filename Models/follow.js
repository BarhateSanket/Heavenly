const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followSchema = new Schema({
    follower: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1, createdAt: -1 });
followSchema.index({ following: 1, createdAt: -1 });

// Update follower and following counts when a follow relationship is created
followSchema.post('save', async function(doc) {
    try {
        await mongoose.model('User').findByIdAndUpdate(
            doc.follower,
            { $inc: { followingCount: 1 } }
        );
        await mongoose.model('User').findByIdAndUpdate(
            doc.following,
            { $inc: { followersCount: 1 } }
        );
    } catch (error) {
        console.error('Error updating user counts after follow save:', error);
    }
});

// Update follower and following counts when a follow relationship is removed
followSchema.pre('remove', async function() {
    try {
        await mongoose.model('User').findByIdAndUpdate(
            this.follower,
            { $inc: { followingCount: -1 } }
        );
        await mongoose.model('User').findByIdAndUpdate(
            this.following,
            { $inc: { followersCount: -1 } }
        );
    } catch (error) {
        console.error('Error updating user counts after follow remove:', error);
    }
});

// Activity generation hook
followSchema.post('save', async function(doc) {
    if (doc.isNew) {  // Only for new documents
        const Activity = require('./activity');

        // Get followed user's name
        const User = mongoose.model('User');
        const followedUser = await User.findById(doc.following).select('username email');

        await Activity.create({
            actor: doc.follower,
            type: 'user_followed',
            target: doc.following,  // Target is the followed user
            targetModel: 'User',
            metadata: {
                followedUserName: followedUser?.username || followedUser?.email || 'a user'
            }
        });
    }
});

module.exports = mongoose.model("Follow", followSchema);