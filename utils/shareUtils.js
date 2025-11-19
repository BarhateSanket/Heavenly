/**
 * Generates a share URL for a given platform and listing.
 * @param {string} platform - The social media platform (facebook, twitter, whatsapp, copy)
 * @param {Object} listing - The listing object containing id, title, etc.
 * @param {string} baseUrl - The base URL of the application
 * @returns {string} The generated share URL
 */
function generateShareUrl(platform, listing, baseUrl) {
    const listingUrl = `${baseUrl}/listings/${listing._id}`;
    const title = encodeURIComponent(listing.title);
    const url = encodeURIComponent(listingUrl);

    switch (platform.toLowerCase()) {
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        case 'whatsapp':
            return `https://wa.me/?text=${title}%20${url}`;
        case 'copy':
            return listingUrl;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

module.exports = { generateShareUrl };