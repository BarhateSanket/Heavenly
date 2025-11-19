const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { bookingSchema } = require("../schema.js");
const Booking = require("../Models/booking.js");
const Listing = require("../Models/listing.js");
const { isLoggedIn } = require("../middleware.js");

// Validation middleware
const validateBooking = (req, res, next) => {
    const { error } = bookingSchema.validate(req.body);
    if (error) {
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

// Availability checking middleware
const checkAvailability = wrapAsync(async (req, res, next) => {
    const { listingId } = req.params;
    const { checkIn, checkOut, guests } = req.body.booking;

    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Check max guests
    if (guests > listing.maxGuests) {
        req.flash("error", `Maximum ${listing.maxGuests} guests allowed`);
        return res.redirect(`/listings/${listingId}`);
    }

    // Check blocked dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const blockedDates = listing.blockedDates.map(date => new Date(date).toDateString());
    const requestedDates = [];
    for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
        requestedDates.push(d.toDateString());
    }

    const hasBlockedDate = requestedDates.some(date => blockedDates.includes(date));
    if (hasBlockedDate) {
        req.flash("error", "Selected dates are not available");
        return res.redirect(`/listings/${listingId}`);
    }

    // Check existing bookings
    const conflictingBookings = await Booking.find({
        listing: listingId,
        status: { $in: ['confirmed', 'pending'] },
        $or: [
            {
                checkIn: { $lt: checkOutDate },
                checkOut: { $gt: checkInDate }
            }
        ]
    });

    if (conflictingBookings.length > 0) {
        req.flash("error", "Selected dates are already booked");
        return res.redirect(`/listings/${listingId}`);
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    req.body.booking.totalPrice = nights * listing.price;

    next();
});

// Index - Show user's bookings
router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
    const userId = req.user._id;

    // Bookings as guest
    const guestBookings = await Booking.find({ guest: userId })
        .populate('listing')
        .sort({ createdAt: -1 });

    // Bookings as host (bookings for user's listings)
    const userListings = await Listing.find({ owner: userId }).select('_id');
    const listingIds = userListings.map(listing => listing._id);
    const hostBookings = await Booking.find({ listing: { $in: listingIds } })
        .populate('listing')
        .populate('guest')
        .sort({ createdAt: -1 });

    res.render("bookings/index.ejs", {
        guestBookings,
        hostBookings
    });
}));

// New booking form
router.get("/new/:listingId", isLoggedIn, wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    res.render("bookings/new.ejs", { listing });
}));

// Create booking
router.post("/:listingId", isLoggedIn, validateBooking, checkAvailability, wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const { checkIn, checkOut, guests, totalPrice } = req.body.booking;

    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Prevent booking own listing
    if (listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot book your own listing!");
        return res.redirect(`/listings/${listingId}`);
    }

    const newBooking = new Booking({
        guest: req.user._id,
        listing: listingId,
        checkIn,
        checkOut,
        guests,
        totalPrice
    });

    await newBooking.save();
    req.flash("success", "Booking request sent successfully!");
    res.redirect(`/bookings/${newBooking._id}`);
}));

// Show booking details
router.get("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id)
        .populate('listing')
        .populate('guest');

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }

    // Check permissions
    const isGuest = booking.guest._id.equals(req.user._id);
    const isHost = booking.listing.owner.equals(req.user._id);

    if (!isGuest && !isHost) {
        req.flash("error", "You don't have permission to view this booking");
        return res.redirect("/bookings");
    }

    res.render("bookings/show.ejs", { booking, isGuest, isHost });
}));

// Update booking status (host only)
router.put("/:id/status", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id).populate('listing');
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }

    // Only host can update status
    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to update this booking");
        return res.redirect(`/bookings/${id}`);
    }

    const validStatuses = ['confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        req.flash("error", "Invalid status");
        return res.redirect(`/bookings/${id}`);
    }

    booking.status = status;
    await booking.save();

    req.flash("success", `Booking ${status} successfully!`);
    res.redirect(`/bookings/${id}`);
}));

// Cancel booking (guest only)
router.delete("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate('listing');
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }

    // Only guest can cancel
    if (!booking.guest.equals(req.user._id)) {
        req.flash("error", "You don't have permission to cancel this booking");
        return res.redirect(`/bookings/${id}`);
    }

    // Only pending or confirmed bookings can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
        req.flash("error", "This booking cannot be cancelled");
        return res.redirect(`/bookings/${id}`);
    }

    booking.status = 'cancelled';
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/bookings");
}));

// API: Get availability for a listing
router.get("/api/availability/:listingId", wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const { start, end } = req.query;

    const listing = await Listing.findById(listingId);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }

    // Get blocked dates
    const blockedDates = listing.blockedDates.map(date => new Date(date));

    // Get booked dates
    const bookings = await Booking.find({
        listing: listingId,
        status: { $in: ['confirmed', 'pending'] }
    });

    const bookedDates = [];
    bookings.forEach(booking => {
        for (let d = new Date(booking.checkIn); d < new Date(booking.checkOut); d.setDate(d.getDate() + 1)) {
            bookedDates.push(new Date(d));
        }
    });

    const unavailableDates = [...blockedDates, ...bookedDates].map(date => date.toISOString().split('T')[0]);

    res.json({
        unavailableDates,
        maxGuests: listing.maxGuests
    });
}));

module.exports = router;