const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String, // Store avatar filename or URL
    },
    bio: {
        type: String,
        maxlength: 500,
        trim: true,
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    followersCount: {
        type: Number,
        default: 0,
    },
    followingCount: {
        type: Number,
        default: 0,
    },
    wishlists: [{
        type: Schema.Types.ObjectId,
        ref: "Wishlist",
    }],
    location: {
        address: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
        coordinates: {
            latitude: {
                type: Number,
                min: -90,
                max: 90,
            },
            longitude: {
                type: Number,
                min: -180,
                max: 180,
            },
        },
    },
    preferences: {
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'],
        },
        timezone: {
            type: String,
            default: 'UTC',
        },
    },
    verification: {
        email: {
            verified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: Date,
        },
        phone: {
            verified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: Date,
        },
        identity: {
            verified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: Date,
            documentType: String,
        },
    },
    notificationPreferences: {
        email: {
            type: Boolean,
            default: true,
        },
        push: {
            type: Boolean,
            default: true,
        },
        sms: {
            type: Boolean,
            default: false,
        },
        types: {
            booking: {
                type: Boolean,
                default: true,
            },
            message: {
                type: Boolean,
                default: true,
            },
            review: {
                type: Boolean,
                default: true,
            },
            marketing: {
                type: Boolean,
                default: false,
            },
            security: {
                type: Boolean,
                default: true,
            },
        },
    },
    
    // Security Settings
    securitySettings: {
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: {
            type: String,
        },
        backupCodes: [{
            type: String,
        }],
        loginNotifications: {
            type: Boolean,
            default: true,
        },
        sessionTimeout: {
            type: Number,
            default: 24, // hours
            min: 1,
            max: 168, // 1 week
        },
        activeSessions: [{
            sessionId: String,
            deviceInfo: String,
            ipAddress: String,
            location: {
                city: String,
                country: String,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            lastActivity: {
                type: Date,
                default: Date.now,
            },
            isActive: {
                type: Boolean,
                default: true,
            },
        }],
    },

    // Privacy Settings
    privacySettings: {
        profileVisibility: {
            type: String,
            enum: ['public', 'private', 'followers-only'],
            default: 'public',
        },
        showOnlineStatus: {
            type: Boolean,
            default: true,
        },
        allowDataSharing: {
            type: Boolean,
            default: false,
        },
        allowPersonalizedAds: {
            type: Boolean,
            default: false,
        },
        searchEngineIndexing: {
            type: Boolean,
            default: true,
        },
        showInSearchResults: {
            type: Boolean,
            default: true,
        },
        blockedUsers: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            blockedAt: {
                type: Date,
                default: Date.now,
            },
            reason: {
                type: String,
                maxlength: 500,
            },
        }],
        mutedUsers: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            mutedAt: {
                type: Date,
                default: Date.now,
            },
            reason: {
                type: String,
                maxlength: 500,
            },
        }],
    },

    // Account Management Settings
    accountSettings: {
        dataRetention: {
            type: String,
            enum: ['30-days', '90-days', '1-year', '2-years', 'indefinite'],
            default: '2-years',
        },
        gdprConsent: {
            hasConsent: {
                type: Boolean,
                default: false,
            },
            consentDate: Date,
            version: {
                type: String,
                default: '1.0',
            },
        },
        termsVersion: {
            type: String,
            default: '1.0',
        },
        privacyPolicyVersion: {
            type: String,
            default: '1.0',
        },
        marketingConsent: {
            hasConsent: {
                type: Boolean,
                default: false,
            },
            consentDate: Date,
            version: {
                type: String,
                default: '1.0',
            },
        },
        dataExportRequests: [{
            requestedAt: {
                type: Date,
                default: Date.now,
            },
            status: {
                type: String,
                enum: ['pending', 'processing', 'completed', 'failed'],
                default: 'pending',
            },
            downloadUrl: String,
            expiresAt: Date,
        }],
        accountStatus: {
            type: String,
            enum: ['active', 'deactivated', 'suspended', 'deleted'],
            default: 'active',
        },
        deactivationReason: String,
        deactivationDate: Date,
        scheduledDeletionDate: Date,
    },

    // Login Activity Tracking
    loginActivity: [{
        timestamp: {
            type: Date,
            default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        deviceInfo: String,
        location: {
            city: String,
            country: String,
        },
        success: {
            type: Boolean,
            default: true,
        },
        failureReason: String,
    }],

    // Recovery Settings
    recoverySettings: {
        recoveryEmail: {
            type: String,
            verified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: Date,
        },
        recoveryPhone: {
            type: String,
            verified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: Date,
        },
        securityQuestions: [{
            question: {
                type: String,
                required: true,
            },
            answer: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        backupEmail: {
            type: String,
            verified: {
                type: Boolean,
                default: false,
            },
            verifiedAt: Date,
        },
    },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
