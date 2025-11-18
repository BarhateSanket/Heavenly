const express = require('express');
const router = express.Router();
const Listing = require('../Models/listing');
const { body, validationResult } = require('express-validator');

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

module.exports = router;
