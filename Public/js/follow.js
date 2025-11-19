/**
 * Follow/Unfollow AJAX functionality
 */
class FollowManager {
    constructor() {
        this.init();
    }

    init() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const followBtn = e.target.closest('.follow-btn');
            if (followBtn) {
                e.preventDefault();
                this.handleFollowClick(followBtn);
            }
        });
    }

    async handleFollowClick(button) {
        const userId = button.dataset.userId;
        const action = button.dataset.action; // 'follow' or 'unfollow'

        if (!userId || !action) return;

        // Disable button during request
        this.setButtonLoading(button, true);

        try {
            const response = await fetch(`/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.handleSuccess(button, data, action);
                if (window.toast) {
                    window.toast.success(data.message || `Successfully ${action}ed user`);
                }
            } else {
                throw new Error(data.message || 'An error occurred');
            }
        } catch (error) {
            console.error('Follow error:', error);
            this.handleError(button, error.message);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to update follow status');
            }
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    handleSuccess(button, data, action) {
        // Update button appearance and action
        const newAction = action === 'follow' ? 'unfollow' : 'follow';
        const newText = action === 'follow' ? 'Unfollow' : 'Follow';
        const newClass = action === 'follow' ? 'btn-outline-danger' : 'btn-primary';

        button.dataset.action = newAction;
        button.textContent = newText;
        button.className = `btn ${newClass} btn-sm`;

        // Update follower/following counts if they exist on the page
        this.updateCounts(data.followersCount, data.followingCount);
    }

    handleError(button, message) {
        // Re-enable button
        this.setButtonLoading(button, false);

        // Show error (toast is handled above)
        console.error('Follow error:', message);
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Processing...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }

    updateCounts(followersCount, followingCount) {
        const followersElement = document.querySelector('.followers-count');
        const followingElement = document.querySelector('.following-count');

        if (followersElement && followersCount !== undefined) {
            followersElement.textContent = followersCount;
        }

        if (followingElement && followingCount !== undefined) {
            followingElement.textContent = followingCount;
        }
    }

    // Static method to initialize on page load
    static init() {
        if (document.querySelector('.follow-btn')) {
            new FollowManager();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    FollowManager.init();
});