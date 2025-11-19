const express = require('express');
const router = express.Router();
const Listing = require('../Models/listing');
const Wishlist = require('../Models/wishlist');
const User = require('../Models/user');
const { body, validationResult } = require('express-validator');
const { isLoggedIn } = require('../middleware');

// GET /api/listings - Get all listings with optional filters
router.get('/listings', [
    // Validation and sanitization
    body('search').optional().trim().escape(),
    body('minPrice').optional().isFloat({ min: 0 }),
    body('maxPrice').optional().isFloat({ min: 0 }),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { country: { $regex: search, $options: 'i' } }
            ];
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        const listings = await Listing.find(query)
            .populate('owner', 'username email')
            .populate('reviews')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Listing.countDocuments(query);

        res.json({
            success: true,
            data: listings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/listings/:id - Get single listing
router.get('/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('owner', 'username email')
            .populate({
                path: 'reviews',
                populate: { path: 'author', select: 'username' }
            });

        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        res.json({ success: true, data: listing });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/listings - Create new listing (requires authentication)
router.post('/listings', [
    body('title').trim().isLength({ min: 1 }).escape(),
    body('description').trim().isLength({ min: 1 }).escape(),
    body('price').isFloat({ min: 0 }),
    body('location').trim().isLength({ min: 1 }).escape(),
    body('country').trim().isLength({ min: 1 }).escape(),
    body('image').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const listingData = {
            ...req.body,
            owner: req.user._id
        };

        const listing = new Listing(listingData);
        await listing.save();

        res.status(201).json({ success: true, data: listing });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/listings/:id - Update listing (owner only)
router.put('/listings/:id', [
    body('title').optional().trim().isLength({ min: 1 }).escape(),
    body('description').optional().trim().isLength({ min: 1 }).escape(),
    body('price').optional().isFloat({ min: 0 }),
    body('location').optional().trim().isLength({ min: 1 }).escape(),
    body('country').optional().trim().isLength({ min: 1 }).escape(),
    body('image').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        Object.assign(listing, req.body);
        await listing.save();

        res.json({ success: true, data: listing });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/listings/:id - Delete listing (owner only)
router.delete('/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Listing.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/wishlists/toggle - Toggle favorite for a listing
router.post('/wishlists/toggle', isLoggedIn, async (req, res) => {
    try {
        const { listingId, wishlistId } = req.body;

        // Find or create default wishlist
        let wishlist;
        if (wishlistId) {
            wishlist = await Wishlist.findOne({ _id: wishlistId, user: req.user._id });
        } else {
            wishlist = await Wishlist.findOne({ user: req.user._id, name: "Favorites" });
            if (!wishlist) {
                wishlist = new Wishlist({
                    name: "Favorites",
                    user: req.user._id,
                    listings: []
                });
                await wishlist.save();
                await User.findByIdAndUpdate(req.user._id, { $push: { wishlists: wishlist._id } });
            }
        }

        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        const listingIndex = wishlist.listings.indexOf(listingId);
        let isFavorited;

        if (listingIndex > -1) {
            // Remove from wishlist
            wishlist.listings.splice(listingIndex, 1);
            isFavorited = false;
        } else {
            // Add to wishlist
            wishlist.listings.push(listingId);
            isFavorited = true;
        }

        await wishlist.save();

        res.json({ success: true, isFavorited });
    } catch (error) {
        console.error('Wishlist Toggle Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/wishlists/check/:listingId - Check if listing is favorited
router.get('/wishlists/check/:listingId', isLoggedIn, async (req, res) => {
    try {
        const { listingId } = req.params;
        const wishlist = await Wishlist.findOne({ user: req.user._id, name: "Favorites" });

        if (!wishlist) {
            return res.json({ success: true, isFavorited: false });
        }

        const isFavorited = wishlist.listings.includes(listingId);
        res.json({ success: true, isFavorited });
    } catch (error) {
        console.error('Wishlist Check Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/analytics/share - Track share events
router.post('/analytics/share', [
    body('platform').isIn(['facebook', 'twitter', 'whatsapp', 'copy']),
    body('listingId').isMongoId(),
    body('timestamp').isISO8601(),
    body('userAgent').optional().trim(),
    body('referrer').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { platform, listingId, timestamp, userAgent, referrer } = req.body;

        // Log the share event (in production, you might want to store this in a database)
        console.log(`Share tracked: Platform=${platform}, Listing=${listingId}, Time=${timestamp}, UserAgent=${userAgent}, Referrer=${referrer}`);

        // For now, just respond with success
        res.json({ success: true, message: 'Share event tracked' });
    } catch (error) {
        console.error('Analytics Share Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
