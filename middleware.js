module.exports.isLoggedIn = (req, res, next)=>{
    console.log(req.path, "..", req.originalUrl);
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create listings");
        return res.redirect("/listings");
    }  
    next();
}

module.exports.saveRedirectUrl = (req, res, next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.isAdmin = (req, res, next)=>{
    if(!req.user || req.user.username !== 'admin'){ // Simple check, can be enhanced
        req.flash("error", "Access denied. Admin privileges required.");
        return res.redirect("/listings");
    }
    next();
}

module.exports.verifyBooking = async (req, res, next)=>{
    const Booking = require("./Models/booking.js");
    const booking = await Booking.findById(req.body.review.booking).populate('listing');
    if(!booking || booking.status !== 'completed' || !booking.guest.equals(req.user._id)){
        req.flash("error", "You can only review completed bookings.");
        return res.redirect(`/listings/${req.params.id}`);
    }
    req.booking = booking;
    next();
}