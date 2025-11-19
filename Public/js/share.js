/**
 * Handles sharing functionality for social media platforms
 */
function handleShare() {
    const shareButtons = document.querySelectorAll('.share-btn');

    shareButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();

            const platform = this.getAttribute('data-platform');
            const url = this.getAttribute('data-url');
            const listingId = window.location.pathname.split('/')[2]; // Extract listing ID from URL

            try {
                if (platform === 'copy') {
                    await navigator.clipboard.writeText(url);
                    // Show success message
                    showFlashMessage('Link copied to clipboard!', 'success');
                } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }

                // Track the share
                trackShare(platform, listingId);
            } catch (error) {
                console.error('Share failed:', error);
                showFlashMessage('Failed to share. Please try again.', 'error');
            }
        });
    });
}

/**
 * Tracks share events by sending data to analytics endpoint
 * @param {string} platform - The platform used for sharing
 * @param {string} listingId - The ID of the listing being shared
 */
function trackShare(platform, listingId) {
    fetch('/api/analytics/share', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            platform: platform,
            listingId: listingId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        })
    })
    .then(response => {
        if (!response.ok) {
            console.warn('Failed to track share:', response.status);
        }
    })
    .catch(error => {
        console.error('Error tracking share:', error);
    });
}

/**
 * Shows a temporary flash message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, etc.)
 */
function showFlashMessage(message, type) {
    // Create flash message element
    const flashDiv = document.createElement('div');
    flashDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    flashDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    flashDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to body
    document.body.appendChild(flashDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (flashDiv.parentNode) {
            flashDiv.remove();
        }
    }, 3000);
}

// Initialize share functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', handleShare);