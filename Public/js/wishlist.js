// Wishlist functionality for AJAX toggle with loading states and toast notifications

class WishlistManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.wishlist-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.wishlist-toggle');
                this.toggleWishlist(button);
            }
        });

        // Initialize heart states on page load
        this.initializeHearts();
    }

    async initializeHearts() {
        const toggleButtons = document.querySelectorAll('.wishlist-toggle[data-listing-id]');
        for (const button of toggleButtons) {
            const listingId = button.dataset.listingId;
            const isFavoritedAttr = button.dataset.isFavorited;

            if (isFavoritedAttr !== undefined) {
                // Use server-provided data
                this.updateHeartState(button, isFavoritedAttr === 'true');
            } else {
                // Fallback to API check
                try {
                    const response = await fetch(`/api/wishlists/check/${listingId}`);
                    const data = await response.json();
                    this.updateHeartState(button, data.isFavorited);
                } catch (error) {
                    console.error('Error checking wishlist status:', error);
                }
            }
        }
    }

    async toggleWishlist(button) {
        const listingId = button.dataset.listingId;
        if (!listingId) return;

        // Show loading state
        this.setLoadingState(button, true);

        try {
            const response = await fetch('/api/wishlists/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ listingId })
            });

            const data = await response.json();

            if (response.ok) {
                this.updateHeartState(button, data.isFavorited);
                this.showToast(
                    data.isFavorited ? 'Added to wishlist!' : 'Removed from wishlist!',
                    data.isFavorited ? 'success' : 'info'
                );
            } else {
                throw new Error(data.message || 'Failed to update wishlist');
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            this.showToast('Error updating wishlist', 'error');
        } finally {
            this.setLoadingState(button, false);
        }
    }

    updateHeartState(button, isFavorited) {
        const icon = button.querySelector('i');
        if (!icon) return;

        if (button.classList.contains('btn')) {
            // Button style (used in show page)
            if (isFavorited) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                button.classList.remove('btn-outline-danger');
                button.classList.add('btn-danger');
                button.innerHTML = '<i class="fas fa-heart me-1"></i>Remove from Wishlist';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-danger');
                button.innerHTML = '<i class="far fa-heart me-1"></i>Add to Wishlist';
            }
        } else {
            // Overlay style (used in index and wishlist pages)
            if (isFavorited) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#dc3545';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = 'white';
            }
        }
    }

    setLoadingState(button, isLoading) {
        if (button.classList.contains('btn')) {
            // Button style
            button.disabled = isLoading;
            if (isLoading) {
                const originalText = button.innerHTML;
                button.dataset.originalText = originalText;
                button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...';
            } else {
                button.innerHTML = button.dataset.originalText || button.innerHTML;
            }
        } else {
            // Overlay style
            const icon = button.querySelector('i');
            if (icon) {
                icon.style.opacity = isLoading ? '0.5' : '1';
            }
        }
    }

    showToast(message, type) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.wishlist-toast');
        existingToasts.forEach(toast => toast.remove());

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} position-fixed wishlist-toast`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WishlistManager();
});