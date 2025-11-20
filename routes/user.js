const express = require("express");
const router = express.Router();
const User = require("../Models/user");
const Follow = require("../Models/follow");
const Booking = require("../Models/booking");
const Listing = require("../Models/listing");
const Conversation = require("../Models/conversation");
const Message = require("../Models/message");
const Activity = require("../Models/activity");
const Transaction = require("../Models/transaction");
const Billing = require("../Models/billing");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const {saveRedirectUrl, isLoggedIn} = require("../middleware.js");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const stringify = require('csv-stringify').stringify;
const moment = require("moment");

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, JPG, PNG, GIF) are allowed'));
        }
    }
});

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

// Edit Profile - GET route
router.get("/profile/edit", isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }
    
    res.render("users/edit-profile", { user, errors: [], oldInput: {} });
}));

// Edit Profile - POST route
router.post("/profile/edit", 
    isLoggedIn,
    upload.single('avatar'),
    [
        body('fullName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Full name must be between 2 and 50 characters'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email address'),
        body('phone')
            .optional()
            .trim()
            .isMobilePhone()
            .withMessage('Please provide a valid phone number'),
        body('bio')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Bio cannot exceed 500 characters'),
        body('address')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Address cannot exceed 200 characters'),
        body('city')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('City cannot exceed 100 characters'),
        body('country')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),
        body('language')
            .optional()
            .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'])
            .withMessage('Invalid language selection'),
        body('currency')
            .optional()
            .isIn(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'])
            .withMessage('Invalid currency selection'),
        body('currentPassword')
            .optional()
            .isLength({ min: 6 })
            .withMessage('Current password must be at least 6 characters'),
        body('newPassword')
            .optional()
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (req.body.newPassword && value !== req.body.newPassword) {
                    throw new Error('Password confirmation does not match');
                }
                return true;
            })
    ],
    wrapAsync(async (req, res) => {
        const errors = validationResult(req);
        const user = await User.findById(req.user._id);
        
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/listings");
        }

        if (!errors.isEmpty()) {
            return res.status(400).render("users/edit-profile", {
                user,
                errors: errors.array(),
                oldInput: req.body
            });
        }

        try {
            const {
                fullName,
                email,
                phone,
                bio,
                address,
                city,
                country,
                language,
                currency,
                timezone,
                currentPassword,
                newPassword,
                confirmPassword,
                emailNotifications,
                pushNotifications,
                bookingNotifications,
                messageNotifications,
                reviewNotifications
            } = req.body;

            // Check if email is already taken by another user
            const existingUser = await User.findOne({ 
                email: email, 
                _id: { $ne: req.user._id } 
            });
            
            if (existingUser) {
                return res.status(400).render("users/edit-profile", {
                    user,
                    errors: [{ msg: 'Email is already taken by another user' }],
                    oldInput: req.body
                });
            }

            // Handle password change
            if (newPassword || currentPassword) {
                if (!currentPassword || !newPassword) {
                    return res.status(400).render("users/edit-profile", {
                        user,
                        errors: [{ msg: 'Both current password and new password are required to change password' }],
                        oldInput: req.body
                    });
                }

                try {
                    await new Promise((resolve, reject) => {
                        user.changePassword(currentPassword, newPassword, function(err) {
                            if (err) {
                                reject(new Error('Current password is incorrect'));
                            } else {
                                resolve();
                            }
                        });
                    });
                } catch (error) {
                    return res.status(400).render("users/edit-profile", {
                        user,
                        errors: [{ msg: error.message }],
                        oldInput: req.body
                    });
                }
            }

            // Update user fields
            user.fullName = fullName || user.fullName;
            user.email = email || user.email;
            user.phone = phone || user.phone;
            user.bio = bio || user.bio;
            
            // Update location
            user.location = {
                address: address || user.location?.address,
                city: city || user.location?.city,
                country: country || user.location?.country,
                coordinates: user.location?.coordinates // Keep existing coordinates
            };
            
            // Update preferences
            user.preferences = {
                language: language || user.preferences?.language || 'en',
                currency: currency || user.preferences?.currency || 'USD',
                timezone: timezone || user.preferences?.timezone || 'UTC'
            };
            
            // Update notification preferences
            user.notificationPreferences = {
                email: emailNotifications === 'on',
                push: pushNotifications === 'on',
                types: {
                    booking: bookingNotifications === 'on',
                    message: messageNotifications === 'on',
                    review: reviewNotifications === 'on'
                }
            };

            // Handle avatar upload
            if (req.file) {
                // Delete old avatar if exists
                if (user.avatar) {
                    // In production, you might want to delete the old file from disk
                    // For now, we'll just overwrite it
                }
                user.avatar = req.file.filename;
            }

            await user.save();
            
            req.flash("success", "Profile updated successfully!");
            res.redirect(`/users/profile/${user._id}`);
            
        } catch (error) {
            console.error('Profile update error:', error);
            return res.status(500).render("users/edit-profile", {
                user,
                errors: [{ msg: 'An error occurred while updating your profile' }],
                oldInput: req.body
            });
        }
    })
);

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

// Settings page - GET
router.get("/settings", isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    res.render("users/settings", {
        user,
        errors: [],
        oldInput: {},
        activeTab: req.query.tab || 'security'
    });
}));

// Settings page - POST
router.post("/settings", 
    isLoggedIn,
    [
        // Password validation
        body('currentPassword')
            .optional()
            .isLength({ min: 6 })
            .withMessage('Current password must be at least 6 characters'),
        body('newPassword')
            .optional()
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (req.body.newPassword && value !== req.body.newPassword) {
                    throw new Error('Password confirmation does not match');
                }
                return true;
            }),

        // Security settings validation
        body('twoFactorEnabled')
            .optional()
            .isBoolean()
            .withMessage('Two-factor authentication setting must be boolean'),
        body('loginNotifications')
            .optional()
            .isBoolean()
            .withMessage('Login notifications setting must be boolean'),
        body('sessionTimeout')
            .optional()
            .isInt({ min: 1, max: 168 })
            .withMessage('Session timeout must be between 1 and 168 hours'),

        // Notification preferences validation
        body('emailNotifications')
            .optional()
            .isBoolean()
            .withMessage('Email notifications setting must be boolean'),
        body('pushNotifications')
            .optional()
            .isBoolean()
            .withMessage('Push notifications setting must be boolean'),
        body('smsNotifications')
            .optional()
            .isBoolean()
            .withMessage('SMS notifications setting must be boolean'),

        // Privacy settings validation
        body('profileVisibility')
            .optional()
            .isIn(['public', 'private', 'followers-only'])
            .withMessage('Profile visibility must be public, private, or followers-only'),
        body('showOnlineStatus')
            .optional()
            .isBoolean()
            .withMessage('Show online status setting must be boolean'),
        body('allowDataSharing')
            .optional()
            .isBoolean()
            .withMessage('Data sharing setting must be boolean'),
        body('searchEngineIndexing')
            .optional()
            .isBoolean()
            .withMessage('Search engine indexing setting must be boolean'),

        // Account settings validation
        body('dataRetention')
            .optional()
            .isIn(['30-days', '90-days', '1-year', '2-years', 'indefinite'])
            .withMessage('Invalid data retention period'),
        body('marketingConsent')
            .optional()
            .isBoolean()
            .withMessage('Marketing consent setting must be boolean'),

        // Recovery settings validation
        body('recoveryEmail')
            .optional()
            .isEmail()
            .withMessage('Recovery email must be a valid email address'),
        body('recoveryPhone')
            .optional()
            .isMobilePhone()
            .withMessage('Recovery phone must be a valid phone number'),
    ],
    wrapAsync(async (req, res) => {
        const errors = validationResult(req);
        const user = await User.findById(req.user._id);
        
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/listings");
        }

        if (!errors.isEmpty()) {
            return res.status(400).render("users/settings", {
                user,
                errors: errors.array(),
                oldInput: req.body,
                activeTab: req.query.tab || 'security'
            });
        }

        try {
            const settingType = req.body.settingType || 'general';
            
            // Handle password change
            if (req.body.currentPassword || req.body.newPassword) {
                if (!req.body.currentPassword || !req.body.newPassword) {
                    return res.status(400).render("users/settings", {
                        user,
                        errors: [{ msg: 'Both current password and new password are required to change password' }],
                        oldInput: req.body,
                        activeTab: 'security'
                    });
                }

                try {
                    await new Promise((resolve, reject) => {
                        user.changePassword(req.body.currentPassword, req.body.newPassword, function(err) {
                            if (err) {
                                reject(new Error('Current password is incorrect'));
                            } else {
                                resolve();
                            }
                        });
                    });
                } catch (error) {
                    return res.status(400).render("users/settings", {
                        user,
                        errors: [{ msg: error.message }],
                        oldInput: req.body,
                        activeTab: 'security'
                    });
                }
            }

            // Update security settings
            if (settingType === 'security' || settingType === 'all') {
                if (req.body.twoFactorEnabled !== undefined) {
                    user.securitySettings.twoFactorEnabled = req.body.twoFactorEnabled === 'true';
                }
                if (req.body.loginNotifications !== undefined) {
                    user.securitySettings.loginNotifications = req.body.loginNotifications === 'true';
                }
                if (req.body.sessionTimeout !== undefined) {
                    user.securitySettings.sessionTimeout = parseInt(req.body.sessionTimeout);
                }
                
                // Handle active session termination
                if (req.body.terminateSessionId) {
                    user.securitySettings.activeSessions = user.securitySettings.activeSessions.filter(
                        session => session.sessionId !== req.body.terminateSessionId
                    );
                }
            }

            // Update notification preferences
            if (settingType === 'notifications' || settingType === 'all') {
                user.notificationPreferences.email = req.body.emailNotifications === 'true';
                user.notificationPreferences.push = req.body.pushNotifications === 'true';
                user.notificationPreferences.sms = req.body.smsNotifications === 'true';
                
                if (req.body.types) {
                    user.notificationPreferences.types.booking = req.body.types.booking === 'true';
                    user.notificationPreferences.types.message = req.body.types.message === 'true';
                    user.notificationPreferences.types.review = req.body.types.review === 'true';
                    user.notificationPreferences.types.marketing = req.body.types.marketing === 'true';
                    user.notificationPreferences.types.security = req.body.types.security === 'true';
                }
            }

            // Update privacy settings
            if (settingType === 'privacy' || settingType === 'all') {
                if (req.body.profileVisibility) {
                    user.privacySettings.profileVisibility = req.body.profileVisibility;
                    // Update legacy isPrivate field for backward compatibility
                    user.isPrivate = req.body.profileVisibility === 'private';
                }
                
                if (req.body.showOnlineStatus !== undefined) {
                    user.privacySettings.showOnlineStatus = req.body.showOnlineStatus === 'true';
                }
                
                if (req.body.allowDataSharing !== undefined) {
                    user.privacySettings.allowDataSharing = req.body.allowDataSharing === 'true';
                }
                
                if (req.body.searchEngineIndexing !== undefined) {
                    user.privacySettings.searchEngineIndexing = req.body.searchEngineIndexing === 'true';
                }
            }

            // Update account settings
            if (settingType === 'account' || settingType === 'all') {
                if (req.body.dataRetention) {
                    user.accountSettings.dataRetention = req.body.dataRetention;
                }
                
                if (req.body.marketingConsent !== undefined) {
                    const consent = req.body.marketingConsent === 'true';
                    user.accountSettings.marketingConsent = {
                        hasConsent: consent,
                        consentDate: consent ? new Date() : user.accountSettings.marketingConsent.consentDate,
                        version: user.accountSettings.marketingConsent.version || '1.0'
                    };
                }

                // Handle account deactivation
                if (req.body.action === 'deactivate') {
                    user.accountSettings.accountStatus = 'deactivated';
                    user.accountSettings.deactivationDate = new Date();
                    user.accountSettings.deactivationReason = req.body.deactivationReason || 'User requested deactivation';
                }
                
                // Handle account reactivation
                if (req.body.action === 'reactivate') {
                    user.accountSettings.accountStatus = 'active';
                    user.accountSettings.deactivationDate = undefined;
                    user.accountSettings.deactivationReason = undefined;
                }
            }

            // Update recovery settings
            if (req.body.recoveryEmail || req.body.recoveryPhone) {
                if (req.body.recoveryEmail) {
                    user.recoverySettings.recoveryEmail = req.body.recoveryEmail;
                    user.recoverySettings.recoveryEmail.verified = false;
                }
                if (req.body.recoveryPhone) {
                    user.recoverySettings.recoveryPhone = req.body.recoveryPhone;
                    user.recoverySettings.recoveryPhone.verified = false;
                }
            }

            // Handle data export request
            if (req.body.requestDataExport) {
                const exportRequest = {
                    requestedAt: new Date(),
                    status: 'pending',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                };
                user.accountSettings.dataExportRequests.push(exportRequest);
            }

            await user.save();
            
            req.flash("success", "Settings updated successfully!");
            
            // Redirect to the appropriate tab
            const redirectTab = req.query.tab || 'security';
            res.redirect(`/users/settings?tab=${redirectTab}`);
            
        } catch (error) {
            console.error('Settings update error:', error);
            return res.status(500).render("users/settings", {
                user,
                errors: [{ msg: 'An error occurred while updating your settings' }],
                oldInput: req.body,
                activeTab: req.query.tab || 'security'
            });
        }
    })
);

// Host Dashboard - Specialized dashboard for hosts
router.get("/host/dashboard", isLoggedIn, wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const currentDate = new Date();

    try {
        // Fetch user's listings as host
        const userListings = await Listing.find({ owner: userId })
            .populate({
                path: 'reviews',
                select: 'rating createdAt author',
                populate: { path: 'author', select: 'username email' }
            })
            .sort({ createdAt: -1 });

        const listingIds = userListings.map(listing => listing._id);
        
        // Fetch all bookings for host's listings
        const allHostBookings = await Booking.find({ 
            listing: { $in: listingIds }
        })
        .populate('listing')
        .populate('guest', 'username email avatar')
        .sort({ createdAt: -1 });

        // Analytics calculations
        const confirmedBookings = allHostBookings.filter(booking => booking.status === 'confirmed');
        const completedBookings = allHostBookings.filter(booking => booking.status === 'completed');
        const cancelledBookings = allHostBookings.filter(booking => booking.status === 'cancelled');
        
        // Calculate earnings by time periods
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYear = new Date(now.getFullYear(), 0, 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);

        const monthlyEarnings = confirmedBookings
            .filter(booking => booking.createdAt >= thisMonth)
            .reduce((sum, booking) => sum + booking.totalPrice, 0);

        const yearlyEarnings = confirmedBookings
            .filter(booking => booking.createdAt >= thisYear)
            .reduce((sum, booking) => sum + booking.totalPrice, 0);

        const lastMonthEarnings = confirmedBookings
            .filter(booking => booking.createdAt >= lastMonth && booking.createdAt < thisMonth)
            .reduce((sum, booking) => sum + booking.totalPrice, 0);

        // Calculate average rating and review metrics
        const allReviews = userListings.flatMap(listing => listing.reviews);
        const averageRating = allReviews.length > 0 
            ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
            : 0;

        // Calculate occupancy rate (simplified)
        const totalDaysInYear = 365;
        const bookedDays = confirmedBookings.reduce((sum, booking) => {
            const days = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);
        const occupancyRate = userListings.length > 0 ? (bookedDays / (totalDaysInYear * userListings.length)) * 100 : 0;

        // Upcoming bookings (next 30 days)
        const upcomingBookings = confirmedBookings.filter(booking => {
            const checkInDate = new Date(booking.checkIn);
            const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
            return checkInDate >= now && checkInDate <= thirtyDaysFromNow;
        }).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

        // Monthly earnings data for charts (last 12 months)
        const monthlyEarningsData = [];
        const monthlyBookingCounts = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            const monthBookings = confirmedBookings.filter(booking => 
                booking.createdAt >= monthStart && booking.createdAt <= monthEnd
            );
            
            const monthEarnings = monthBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
            monthlyEarningsData.push(monthEarnings);
            monthlyBookingCounts.push(monthBookings.length);
        }

        // Calculate host performance score (simplified algorithm)
        const responseRate = 95; // Mock data - would be calculated from actual message response times
        const cancellationRate = allHostBookings.length > 0 ? (cancelledBookings.length / allHostBookings.length) * 100 : 0;
        const hostScore = Math.min(100, Math.max(0, 
            (averageRating / 5) * 40 + 
            (occupancyRate / 100) * 30 + 
            (responseRate / 100) * 20 + 
            ((100 - cancellationRate) / 100) * 10
        ));

        // Superhost status check
        const isSuperhost = hostScore >= 90 && averageRating >= 4.8 && confirmedBookings.length >= 10;

        // Recent reviews
        const recentReviews = allReviews
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        res.render("host/dashboard", {
            // Core data
            listings: userListings,
            allBookings: allHostBookings,
            upcomingBookings,
            recentReviews,
            
            // Analytics
            analytics: {
                totalListings: userListings.length,
                totalBookings: confirmedBookings.length,
                completedBookings: completedBookings.length,
                cancelledBookings: cancelledBookings.length,
                totalEarnings: yearlyEarnings,
                monthlyEarnings,
                lastMonthEarnings,
                averageRating,
                occupancyRate: Math.round(occupancyRate),
                hostScore: Math.round(hostScore),
                isSuperhost
            },
            
            // Chart data
            chartData: {
                monthlyEarnings: monthlyEarningsData,
                monthlyBookingCounts: monthlyBookingCounts,
                labels: Array.from({length: 12}, (_, i) => {
                    const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                })
            },

            // Current date for comparisons
            currentDate: now.toISOString()
        });

    } catch (error) {
        console.error('Host dashboard error:', error);
        req.flash("error", "Unable to load host dashboard");
        res.redirect("/users/dashboard");
    }
}));

// User Dashboard
router.get("/dashboard", isLoggedIn, wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const currentDate = new Date();

    try {
        // Fetch user's bookings as guest
        const guestBookings = await Booking.find({ guest: userId })
            .populate('listing')
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch user's bookings as host (bookings for user's listings)
        const userListings = await Listing.find({ owner: userId }).select('_id');
        const listingIds = userListings.map(listing => listing._id);
        
        const hostBookings = await Booking.find({ 
            listing: { $in: listingIds }
        })
        .populate('listing')
        .populate('guest')
        .sort({ createdAt: -1 })
        .limit(5);

        // Fetch user's listings
        const userListingsWithStats = await Listing.find({ owner: userId })
            .populate({
                path: 'reviews',
                select: 'rating createdAt',
                options: { sort: { createdAt: -1 }, limit: 1 }
            })
            .sort({ createdAt: -1 });

        // Fetch recent conversations
        const conversations = await Conversation.find({ 
            participants: userId 
        })
        .populate({
            path: 'participants',
            select: 'username email',
            match: { _id: { $ne: userId } }
        })
        .populate('listing', 'title image')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .limit(10);

        // Get unread message count
        const unreadMessageCount = await Message.countDocuments({
            conversation: { $in: conversations.map(c => c._id) },
            sender: { $ne: userId },
            isRead: false
        });

        // Fetch recent activity feed
        const activities = await Activity.find({ actor: userId })
            .populate('target')
            .sort({ createdAt: -1 })
            .limit(10);

        // Calculate quick stats
        const totalBookings = guestBookings.length;
        const upcomingBookings = guestBookings.filter(booking => 
            new Date(booking.checkIn) > currentDate && 
            ['confirmed', 'pending'].includes(booking.status)
        ).length;

        const totalEarnings = hostBookings
            .filter(booking => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + booking.totalPrice, 0);

        const totalListings = userListings.length;
        const activeListings = userListingsWithStats.filter(listing => 
            !listing.blockedDates || listing.blockedDates.length < 365
        ).length;

        // Separate upcoming and past bookings
        const upcomingGuestBookings = guestBookings.filter(booking => 
            new Date(booking.checkIn) > currentDate
        );
        
        const pastGuestBookings = guestBookings.filter(booking => 
            new Date(booking.checkOut) <= currentDate || booking.status === 'completed'
        );

        const upcomingHostBookings = hostBookings.filter(booking => 
            new Date(booking.checkIn) > currentDate && 
            ['confirmed', 'pending'].includes(booking.status)
        );

        res.render("users/dashboard", {
            // Dashboard data
            guestBookings: {
                upcoming: upcomingGuestBookings,
                past: pastGuestBookings
            },
            hostBookings: {
                upcoming: upcomingHostBookings,
                all: hostBookings
            },
            listings: userListingsWithStats,
            conversations,
            activities,
            unreadMessageCount,
            
            // Quick stats
            stats: {
                totalBookings,
                upcomingBookings,
                totalListings,
                activeListings,
                totalEarnings,
                unreadMessages: unreadMessageCount
            },

            // Flags for role-based content
            isHost: totalListings > 0,
            hasBookings: totalBookings > 0,
            hasConversations: conversations.length > 0
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash("error", "Unable to load dashboard");
        res.redirect("/listings");
    }
}));

// Billing History Page - GET
router.get("/billing", isLoggedIn, wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const currentDate = new Date();
    
    try {
        // Get query parameters for filtering
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const type = req.query.type || '';
        const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
        const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
        const search = req.query.search || '';
        
        // Build query
        let query = {
            $or: [
                { payer: userId },
                { payee: userId }
            ]
        };
        
        if (status) query.status = status;
        if (type) query.type = type;
        if (dateFrom && dateTo) {
            query.createdAt = { $gte: dateFrom, $lte: dateTo };
        }
        
        if (search) {
            query.$or.push(
                { transactionId: { $regex: search, $options: 'i' } },
                { 'metadata.description': { $regex: search, $options: 'i' } }
            );
        }
        
        // Get transactions with pagination
        const transactions = await Transaction.find(query)
            .populate({
                path: 'booking',
                populate: {
                    path: 'listing',
                    select: 'title image'
                }
            })
            .populate('payer', 'username email')
            .populate('payee', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count for pagination
        const totalTransactions = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(totalTransactions / limit);
        
        // Get billing periods
        const billingPeriods = await Billing.find({ user: userId })
            .sort({ periodStart: -1 })
            .limit(12);
        
        // Calculate financial summary for the current user
        const currentYearStart = new Date(currentDate.getFullYear(), 0, 1);
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Guest payments (as payer)
        const guestPayments = await Transaction.aggregate([
            { $match: { payer: userId, createdAt: { $gte: currentYearStart } } },
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: '$amount' },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
                    refunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$breakdown.refundAmount', 0] } }
                }
            }
        ]);
        
        // Host earnings (as payee)
        const hostEarnings = await Transaction.aggregate([
            { $match: { payee: userId, createdAt: { $gte: currentYearStart } } },
            {
                $group: {
                    _id: null,
                    totalEarned: { $sum: '$amount' },
                    processed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $subtract: ['$amount', '$commission.amount'] }, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, { $subtract: ['$amount', '$commission.amount'] }, 0] } },
                    commission: { $sum: '$commission.amount' }
                }
            }
        ]);
        
        // Monthly breakdown for charts
        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    $or: [
                        { payer: userId },
                        { payee: userId }
                    ],
                    createdAt: { $gte: currentYearStart }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' },
                        userRole: {
                            $cond: [
                                { $eq: ['$payer', userId] },
                                'guest',
                                'host'
                            ]
                        }
                    },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: { month: '$_id.month', year: '$_id.year' },
                    guest: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.userRole', 'guest'] }, '$amount', 0]
                        }
                    },
                    host: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.userRole', 'host'] }, '$amount', 0]
                        }
                    },
                    count: { $sum: '$count' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        // Get user's listings to determine if they're a host
        const userListings = await Listing.find({ owner: userId }).select('_id');
        const isHost = userListings.length > 0;
        
        res.render("users/billing", {
            transactions,
            billingPeriods,
            pagination: {
                page,
                totalPages,
                totalTransactions,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                status,
                type,
                dateFrom: req.query.dateFrom || '',
                dateTo: req.query.dateTo || '',
                search
            },
            summary: {
                guest: guestPayments[0] || { totalSpent: 0, completed: 0, pending: 0, refunded: 0 },
                host: hostEarnings[0] || { totalEarned: 0, processed: 0, pending: 0, commission: 0 },
                monthly: monthlyData
            },
            isHost,
            currentDate: moment(currentDate).format('YYYY-MM-DD'),
            currency: req.user.preferences?.currency || 'USD'
        });
        
    } catch (error) {
        console.error('Billing page error:', error);
        req.flash("error", "Unable to load billing information");
        res.redirect("/listings");
    }
}));

// Billing Export - POST
router.post("/billing/export", isLoggedIn, wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const { format, status, type, dateFrom, dateTo } = req.body;
    
    try {
        // Build query based on filters
        let query = {
            $or: [
                { payer: userId },
                { payee: userId }
            ]
        };
        
        if (status) query.status = status;
        if (type) query.type = type;
        if (dateFrom && dateTo) {
            query.createdAt = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
        }
        
        // Get transactions
        const transactions = await Transaction.find(query)
            .populate({
                path: 'booking',
                populate: {
                    path: 'listing',
                    select: 'title'
                }
            })
            .populate('payer', 'username email')
            .populate('payee', 'username email')
            .sort({ createdAt: -1 });
        
        if (format === 'csv') {
            // Prepare CSV data
            const csvData = transactions.map(transaction => ({
                'Transaction ID': transaction.transactionId,
                'Date': moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                'Type': transaction.type,
                'Status': transaction.status,
                'Amount': transaction.amount,
                'Currency': transaction.currency,
                'Description': transaction.metadata?.description || '',
                'Booking Listing': transaction.booking?.listing?.title || '',
                'Guest': transaction.payer.username || transaction.payer.email,
                'Host': transaction.payee.username || transaction.payee.email,
                'Payment Method': transaction.paymentMethod.type,
                'Commission': transaction.commission?.amount || 0,
                'Platform Fee': transaction.breakdown?.fees?.platform || 0,
                'Processing Fee': transaction.breakdown?.fees?.processing || 0
            }));
            
            const stringify = require('csv-stringify').stringify;
            const csv = stringify(csvData, { header: true });
            
            const fileName = `billing-export-${moment().format('YYYY-MM-DD-HH-mm-ss')}.csv`;
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(csv);
            
        } else if (format === 'pdf') {
            // Generate PDF receipt/report
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `billing-report-${moment().format('YYYY-MM-DD-HH-mm-ss')}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            doc.pipe(res);
            
            // PDF Header
            doc.fontSize(20).text('Heavenly - Billing Report', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(12).text(`Report Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
            doc.text(`User: ${req.user.username || req.user.email}`);
            doc.text(`Export Period: ${dateFrom ? moment(dateFrom).format('YYYY-MM-DD') : 'All time'} to ${dateTo ? moment(dateTo).format('YYYY-MM-DD') : 'Present'}`);
            doc.moveDown();
            
            // Summary
            const totalTransactions = transactions.length;
            const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
            const guestPayments = transactions.filter(t => t.payer._id.equals(userId));
            const hostEarnings = transactions.filter(t => t.payee._id.equals(userId));
            
            doc.fontSize(16).text('Summary', { underline: true });
            doc.fontSize(12);
            doc.text(`Total Transactions: ${totalTransactions}`);
            doc.text(`Total Amount: ${totalAmount.toFixed(2)}`);
            doc.text(`Guest Payments: ${guestPayments.length} (${guestPayments.reduce((sum, t) => sum + t.amount, 0).toFixed(2)})`);
            doc.text(`Host Earnings: ${hostEarnings.length} (${hostEarnings.reduce((sum, t) => sum + t.amount, 0).toFixed(2)})`);
            doc.moveDown();
            
            // Transactions table
            doc.fontSize(16).text('Transactions', { underline: true });
            doc.moveDown(0.5);
            
            transactions.forEach((transaction, index) => {
                if (index > 0 && index % 20 === 0) {
                    doc.addPage();
                }
                
                doc.fontSize(10);
                doc.text(`${transaction.transactionId} | ${moment(transaction.createdAt).format('YYYY-MM-DD')} | ${transaction.type} | ${transaction.status} | ${transaction.amount}`);
                
                const listingTitle = transaction.booking?.listing?.title || 'N/A';
                const guestName = transaction.payer.username || transaction.payer.email;
                const hostName = transaction.payee.username || transaction.payee.email;
                
                doc.text(`Listing: ${listingTitle} | Guest: ${guestName} | Host: ${hostName}`);
                
                if (transaction.metadata?.description) {
                    doc.text(`Description: ${transaction.metadata.description}`);
                }
                
                doc.moveDown(0.5);
                doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);
            });
            
            doc.end();
        }
        
    } catch (error) {
        console.error('Billing export error:', error);
        req.flash("error", "Unable to export billing data");
        res.redirect("/users/billing");
    }
}));

// API Routes for Transaction Details and Receipts

// Get transaction details
router.get("/api/transactions/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    try {
        const transaction = await Transaction.findById(id)
            .populate({
                path: 'booking',
                populate: {
                    path: 'listing',
                    select: 'title image location'
                }
            })
            .populate('payer', 'username email')
            .populate('payee', 'username email');
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        // Check if user is authorized to view this transaction
        if (!transaction.payer._id.equals(userId) && !transaction.payee._id.equals(userId)) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this transaction' });
        }
        
        // Generate HTML for the modal
        const html = `
            <div class="modal-header">
                <h5 class="modal-title">Transaction Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Transaction Information</h6>
                        <table class="table table-sm">
                            <tr><td><strong>Transaction ID:</strong></td><td><code>${transaction.transactionId}</code></td></tr>
                            <tr><td><strong>Date:</strong></td><td>${moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss')}</td></tr>
                            <tr><td><strong>Type:</strong></td><td><span class="badge bg-primary">${transaction.type}</span></td></tr>
                            <tr><td><strong>Status:</strong></td><td><span class="badge bg-${transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'warning' : 'danger'}">${transaction.status}</span></td></tr>
                            <tr><td><strong>Amount:</strong></td><td class="text-end"><strong>${transaction.currency} ${transaction.amount.toLocaleString()}</strong></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Booking Information</h6>
                        ${transaction.booking ? `
                            <table class="table table-sm">
                                <tr><td><strong>Listing:</strong></td><td>${transaction.booking.listing.title}</td></tr>
                                <tr><td><strong>Check-in:</strong></td><td>${moment(transaction.booking.checkIn).format('YYYY-MM-DD')}</td></tr>
                                <tr><td><strong>Check-out:</strong></td><td>${moment(transaction.booking.checkOut).format('YYYY-MM-DD')}</td></tr>
                                <tr><td><strong>Guests:</strong></td><td>${transaction.booking.guests}</td></tr>
                            </table>
                        ` : '<p class="text-muted">No booking information available</p>'}
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6>Guest Information</h6>
                        <p><strong>${transaction.payer.username || transaction.payer.email}</strong></p>
                    </div>
                    <div class="col-md-6">
                        <h6>Host Information</h6>
                        <p><strong>${transaction.payee.username || transaction.payee.email}</strong></p>
                    </div>
                </div>
                ${transaction.metadata?.description ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6>Description</h6>
                            <p>${transaction.metadata.description}</p>
                        </div>
                    </div>
                ` : ''}
                ${transaction.commission?.amount ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6>Commission Details</h6>
                            <table class="table table-sm">
                                <tr><td><strong>Platform Commission:</strong></td><td class="text-end">${transaction.currency} ${transaction.commission.amount.toLocaleString()}</td></tr>
                                <tr><td><strong>Host Earnings:</strong></td><td class="text-end">${transaction.currency} ${(transaction.amount - transaction.commission.amount).toLocaleString()}</td></tr>
                            </table>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        res.json({ success: true, html });
        
    } catch (error) {
        console.error('Transaction details error:', error);
        res.status(500).json({ success: false, message: 'Error loading transaction details' });
    }
}));

// Download transaction receipt
router.get("/api/transactions/:id/receipt", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    try {
        const transaction = await Transaction.findById(id)
            .populate({
                path: 'booking',
                populate: {
                    path: 'listing',
                    select: 'title location'
                }
            })
            .populate('payer', 'username email')
            .populate('payee', 'username email');
        
        if (!transaction) {
            req.flash("error", "Transaction not found");
            return res.redirect("/users/billing");
        }
        
        // Check if user is authorized to view this transaction
        if (!transaction.payer._id.equals(userId) && !transaction.payee._id.equals(userId)) {
            req.flash("error", "Not authorized to view this transaction");
            return res.redirect("/users/billing");
        }
        
        // Generate PDF receipt
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `receipt-${transaction.transactionId}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        doc.pipe(res);
        
        // Receipt Header
        doc.fontSize(20).text('Heavenly - Payment Receipt', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Receipt Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
        doc.text(`Transaction ID: ${transaction.transactionId}`);
        doc.moveDown();
        
        // Transaction Details
        doc.fontSize(16).text('Transaction Details', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        
        doc.text(`Date: ${moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss')}`);
        doc.text(`Type: ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`);
        doc.text(`Status: ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}`);
        doc.text(`Amount: ${transaction.currency} ${transaction.amount.toLocaleString()}`);
        
        if (transaction.paymentMethod) {
            doc.text(`Payment Method: ${transaction.paymentMethod.type.replace('_', ' ').toUpperCase()}`);
            if (transaction.paymentMethod.lastFour) {
                doc.text(`Card: ****${transaction.paymentMethod.lastFour}`);
            }
        }
        doc.moveDown();
        
        // Booking Information
        if (transaction.booking) {
            doc.fontSize(16).text('Booking Information', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            doc.text(`Listing: ${transaction.booking.listing.title}`);
            doc.text(`Location: ${transaction.booking.listing.location}`);
            doc.text(`Check-in: ${moment(transaction.booking.checkIn).format('YYYY-MM-DD')}`);
            doc.text(`Check-out: ${moment(transaction.booking.checkOut).format('YYYY-MM-DD')}`);
            doc.text(`Guests: ${transaction.booking.guests}`);
            doc.moveDown();
        }
        
        // Parties Involved
        doc.fontSize(16).text('Parties Involved', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        
        doc.text(`Guest: ${transaction.payer.username || transaction.payer.email}`);
        doc.text(`Host: ${transaction.payee.username || transaction.payee.email}`);
        doc.moveDown();
        
        // Financial Breakdown
        if (transaction.breakdown) {
            doc.fontSize(16).text('Financial Breakdown', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            if (transaction.breakdown.subtotal) {
                doc.text(`Subtotal: ${transaction.currency} ${transaction.breakdown.subtotal.toLocaleString()}`);
            }
            if (transaction.breakdown.taxes) {
                doc.text(`Taxes: ${transaction.currency} ${transaction.breakdown.taxes.toLocaleString()}`);
            }
            if (transaction.breakdown.fees?.platform) {
                doc.text(`Platform Fee: ${transaction.currency} ${transaction.breakdown.fees.platform.toLocaleString()}`);
            }
            doc.text(`Total: ${transaction.currency} ${transaction.amount.toLocaleString()}`);
            doc.moveDown();
        }
        
        // Commission (for host earnings)
        if (transaction.commission?.amount) {
            doc.fontSize(16).text('Commission Details', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            doc.text(`Platform Commission: ${transaction.currency} ${transaction.commission.amount.toLocaleString()}`);
            doc.text(`Commission Rate: ${(transaction.commission.rate * 100).toFixed(1)}%`);
            doc.text(`Net Earnings: ${transaction.currency} ${(transaction.amount - transaction.commission.amount).toLocaleString()}`);
            doc.moveDown();
        }
        
        // Footer
        doc.fontSize(10).text('Thank you for using Heavenly!', { align: 'center' });
        doc.text('For support, contact: support@heavenly.com', { align: 'center' });
        
        doc.end();
        
    } catch (error) {
        console.error('Receipt download error:', error);
        req.flash("error", "Error generating receipt");
        res.redirect("/users/billing");
    }
}));

// Request refund
router.post("/api/transactions/:id/refund", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;
    
    try {
        const transaction = await Transaction.findById(id);
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        // Check if user is the payer (guest) and transaction is eligible for refund
        if (!transaction.payer.equals(userId)) {
            return res.status(403).json({ success: false, message: 'Not authorized to request refund for this transaction' });
        }
        
        if (transaction.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed transactions can be refunded' });
        }
        
        // Update transaction with refund request
        transaction.status = 'refunded';
        transaction.refund = {
            reason: reason || 'User requested refund',
            requestedBy: userId,
            requestedAt: new Date(),
            refundAmount: transaction.amount
        };
        
        await transaction.save();
        
        // TODO: Here you would integrate with your payment processor (Stripe, PayPal, etc.)
        // to actually process the refund
        
        res.json({ success: true, message: 'Refund request submitted successfully' });
        
    } catch (error) {
        console.error('Refund request error:', error);
        res.status(500).json({ success: false, message: 'Error submitting refund request' });
    }
}));

module.exports = router;
