const express = require("express");
const router = express.Router();
const User = require("../Models/user");
const Follow = require("../Models/follow");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const {saveRedirectUrl, isLoggedIn} = require("../middleware.js");

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

// Profile viewing route
router.get("/profile/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Check if profile is private and if current user can view it
    let canView = true;
    let isFollowing = false;
    let isOwnProfile = false;

    if (req.user) {
        isOwnProfile = req.user._id.equals(user._id);

        if (user.isPrivate && !isOwnProfile) {
            // Check if current user follows this user
            const follow = await Follow.findOne({
                follower: req.user._id,
                following: user._id
            });
            canView = !!follow;
            isFollowing = !!follow;
        } else if (!user.isPrivate) {
            // Public profile, check if following
            const follow = await Follow.findOne({
                follower: req.user._id,
                following: user._id
            });
            isFollowing = !!follow;
        }
    } else {
        // Not logged in
        canView = !user.isPrivate;
    }

    if (!canView) {
        req.flash("error", "This profile is private");
        return res.redirect("/listings");
    }

    res.render("users/profile", {
        user,
        isFollowing,
        isOwnProfile,
        canView
    });
}));

// Follow user
router.post("/:id/follow", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const userToFollow = await User.findById(id);

    if (!userToFollow) {
        const errorMsg = "User not found";
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(404).json({ success: false, message: errorMsg });
        }
        req.flash("error", errorMsg);
        return res.redirect("/listings");
    }

    if (req.user._id.equals(userToFollow._id)) {
        const errorMsg = "You cannot follow yourself";
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(400).json({ success: false, message: errorMsg });
        }
        req.flash("error", errorMsg);
        return res.redirect(`/users/profile/${id}`);
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
        follower: req.user._id,
        following: userToFollow._id
    });

    if (existingFollow) {
        const errorMsg = "You are already following this user";
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(400).json({ success: false, message: errorMsg });
        }
        req.flash("error", errorMsg);
        return res.redirect(`/users/profile/${id}`);
    }

    const follow = new Follow({
        follower: req.user._id,
        following: userToFollow._id
    });

    await follow.save();

    // Get updated counts
    const updatedUser = await User.findById(req.user._id);
    const updatedTargetUser = await User.findById(userToFollow._id);

    const successMsg = `You are now following ${userToFollow.username || userToFollow.email}`;
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
            success: true,
            message: successMsg,
            followersCount: updatedTargetUser.followersCount,
            followingCount: updatedUser.followingCount
        });
    }

    req.flash("success", successMsg);
    res.redirect(`/users/profile/${id}`);
}));

// Unfollow user
router.post("/:id/unfollow", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const userToUnfollow = await User.findById(id);

    if (!userToUnfollow) {
        const errorMsg = "User not found";
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(404).json({ success: false, message: errorMsg });
        }
        req.flash("error", errorMsg);
        return res.redirect("/listings");
    }

    const follow = await Follow.findOneAndDelete({
        follower: req.user._id,
        following: userToUnfollow._id
    });

    if (!follow) {
        const errorMsg = "You are not following this user";
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(400).json({ success: false, message: errorMsg });
        }
        req.flash("error", errorMsg);
        return res.redirect(`/users/profile/${id}`);
    }

    // Get updated counts
    const updatedUser = await User.findById(req.user._id);
    const updatedTargetUser = await User.findById(userToUnfollow._id);

    const successMsg = `You unfollowed ${userToUnfollow.username || userToUnfollow.email}`;
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
            success: true,
            message: successMsg,
            followersCount: updatedTargetUser.followersCount,
            followingCount: updatedUser.followingCount
        });
    }

    req.flash("success", successMsg);
    res.redirect(`/users/profile/${id}`);
}));

// Followers list
router.get("/:id/followers", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Check privacy
    let canView = true;
    if (req.user) {
        const isOwnProfile = req.user._id.equals(user._id);
        if (user.isPrivate && !isOwnProfile) {
            const follow = await Follow.findOne({
                follower: req.user._id,
                following: user._id
            });
            canView = !!follow;
        }
    } else {
        canView = !user.isPrivate;
    }

    if (!canView) {
        req.flash("error", "This profile is private");
        return res.redirect("/listings");
    }

    const followers = await Follow.find({ following: user._id })
        .populate('follower', 'username email')
        .sort({ createdAt: -1 });

    res.render("users/followers", {
        user,
        followers: followers.map(f => f.follower),
        canView
    });
}));

// Following list
router.get("/:id/following", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Check privacy
    let canView = true;
    if (req.user) {
        const isOwnProfile = req.user._id.equals(user._id);
        if (user.isPrivate && !isOwnProfile) {
            const follow = await Follow.findOne({
                follower: req.user._id,
                following: user._id
            });
            canView = !!follow;
        }
    } else {
        canView = !user.isPrivate;
    }

    if (!canView) {
        req.flash("error", "This profile is private");
        return res.redirect("/listings");
    }

    const following = await Follow.find({ follower: user._id })
        .populate('following', 'username email followersCount followingCount')
        .sort({ createdAt: -1 });

    res.render("users/following", {
        user,
        following: following.map(f => f.following),
        canView
    });
}));

// Privacy toggle
router.post("/privacy/toggle", isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.isPrivate = !user.isPrivate;
    await user.save();

    req.flash("success", `Your account is now ${user.isPrivate ? 'private' : 'public'}`);
    res.redirect(`/users/profile/${req.user._id}`);
}));

module.exports = router;
