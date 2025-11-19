document.addEventListener('DOMContentLoaded', function() {
    const activityFeed = document.getElementById('activity-feed');
    const loadMoreBtn = document.getElementById('load-more');
    let currentPage = 1;
    let isLoading = false;

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreActivities);
    }

    async function loadMoreActivities() {
        if (isLoading) return;

        isLoading = true;
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';

        try {
            currentPage++;
            const response = await fetch(`/activities/api/feed?page=${currentPage}&limit=20`);

            if (!response.ok) {
                throw new Error('Failed to load activities');
            }

            const data = await response.json();

            if (data.activities && data.activities.length > 0) {
                data.activities.forEach(activity => {
                    const activityElement = createActivityElement(activity);
                    activityFeed.appendChild(activityElement);
                });

                if (!data.hasMore) {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading more activities:', error);
            // Show error message to user
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-3';
            errorDiv.textContent = 'Failed to load more activities. Please try again.';
            activityFeed.appendChild(errorDiv);

            // Re-enable button after a delay
            setTimeout(() => {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = 'Load More Activities';
            }, 3000);
        } finally {
            if (loadMoreBtn && loadMoreBtn.style.display !== 'none') {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = 'Load More Activities';
            }
            isLoading = false;
        }
    }

    function createActivityElement(activity) {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'card mb-3 activity-item';
        activityDiv.setAttribute('data-activity-id', activity.id);

        const timeAgo = getTimeAgo(new Date(activity.createdAt));

        activityDiv.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <img src="${activity.actor.avatar || '/default-avatar.png'}"
                         class="rounded-circle me-3"
                         width="40" height="40" alt="Avatar">
                    <div class="flex-grow-1">
                        <p class="mb-1">
                            <strong>${activity.actor.username || activity.actor.email}</strong>
                            ${getActivityText(activity)}
                            <small class="text-muted">
                                ${timeAgo}
                            </small>
                        </p>
                        ${activity.target ? `<div class="activity-target">${renderActivityTarget(activity)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;

        return activityDiv;
    }

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
        if (!activity.target) return '';

        switch (activity.type) {
            case 'listing_created':
                return `<a href="/listings/${activity.target._id}">${activity.target.title}</a>`;
            case 'review_posted':
                if (activity.target.listing && activity.target.listing.title) {
                    return `<a href="/listings/${activity.target.listing._id}#review-${activity.target._id}">${activity.target.listing.title}</a>`;
                }
                return `<a href="/listings/${activity.target.listing}">a listing</a>`;
            case 'booking_made':
            case 'booking_confirmed':
            case 'booking_cancelled':
                if (activity.target.listing && activity.target.listing.title) {
                    return `<a href="/listings/${activity.target.listing._id}">${activity.target.listing.title}</a>`;
                }
                return `<a href="/listings/${activity.target.listing}">a listing</a>`;
            case 'user_followed':
                return `<a href="/users/${activity.target._id}">${activity.target.username || activity.target.email}</a>`;
            case 'wishlist_added':
                if (activity.target.listing && activity.target.listing.title) {
                    return `<a href="/listings/${activity.target.listing._id}">${activity.target.listing.title}</a>`;
                }
                return `<a href="/listings/${activity.target.listing}">a listing</a>`;
            case 'message_sent':
                return `<a href="/messages">${activity.metadata?.recipientName || 'someone'}</a>`;
            default:
                return '';
        }
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString();
    }
});