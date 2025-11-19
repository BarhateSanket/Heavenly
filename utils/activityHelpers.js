// Activity helper functions for the activity feed system

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
    const target = activity.targetData;
    if (!target) return '';

    switch (activity.type) {
        case 'listing_created':
            return `<a href="/listings/${target._id}">${target.title}</a>`;
        case 'review_posted':
            // For reviews, we need to get the listing from the review
            if (target.listing && target.listing.title) {
                return `<a href="/listings/${target.listing._id}#review-${target._id}">${target.listing.title}</a>`;
            }
            return `<a href="/listings/${target.listing}">a listing</a>`;
        case 'booking_made':
        case 'booking_confirmed':
        case 'booking_cancelled':
            if (target.listing && target.listing.title) {
                return `<a href="/listings/${target.listing._id}">${target.listing.title}</a>`;
            }
            return `<a href="/listings/${target.listing}">a listing</a>`;
        case 'user_followed':
            return `<a href="/users/${target._id}">${target.username || target.email}</a>`;
        case 'wishlist_added':
            if (target.listing && target.listing.title) {
                return `<a href="/listings/${target.listing._id}">${target.listing.title}</a>`;
            }
            return `<a href="/listings/${target.listing}">a listing</a>`;
        case 'message_sent':
            return `<a href="/messages">${target.recipientName || 'someone'}</a>`;
        default:
            return '';
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return new Date(date).toLocaleDateString();
}

module.exports = {
    getActivityText,
    renderActivityTarget,
    getTimeAgo
};