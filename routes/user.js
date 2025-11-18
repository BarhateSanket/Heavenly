const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js"); 

// Add a simple test route
router.get("/", (req, res) => {
    res.send("User router is working!");
});

router.get("/signup", (req, res) => {
    console.log("Signup route hit!");
    try {
     res.render("users/signup");
    } catch (err) {
        console.log("Error rendering signup:", err);
    }
});

router.post("/signup", wrapAsync(async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const newUser = new User({username, email});
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err)=>{
            if(err){
                return next(err);
            }
            req.flash("success", "Welcome to Heavenly!");
            res.redirect("/listings");
        });
    } catch (err) {
        console.log("Error rendering signup:", err);
        req.flash("error", err.message);
        res.redirect("/signup");
    }
}));

router.get("/login", (req, res) => {
    res.render("users/login");
});

router.post("/login",saveRedirectUrl, passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), (req, res) => {
    req.flash("success", "Welcome back to Heavenly!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
});

router.get("/logout", (req, res, next)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    })
})

module.exports = router;    
