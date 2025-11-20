const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    // Transaction identification
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    
    // Related booking
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    
    // Users involved
    payer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    payee: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    // Transaction details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']
    },
    
    // Transaction type and status
    type: {
        type: String,
        required: true,
        enum: ['payment', 'refund', 'payout', 'commission', 'dispute']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    // Payment method details
    paymentMethod: {
        type: {
            type: String,
            enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'wallet', 'other'],
            required: true
        },
        lastFour: String,
        brand: String, // visa, mastercard, etc.
        expiryMonth: Number,
        expiryYear: Number
    },
    
    // Financial breakdown
    breakdown: {
        subtotal: Number,
        taxes: Number,
        fees: {
            platform: Number,
            processing: Number,
            other: Number
        },
        total: Number,
        refundAmount: {
            type: Number,
            default: 0
        }
    },
    
    // Commission details (for platform earnings)
    commission: {
        rate: Number, // percentage
        amount: Number,
        currency: String
    },
    
    // Refund information
    refund: {
        reason: String,
        requestedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        requestedAt: Date,
        processedAt: Date,
        refundTransactionId: String
    },
    
    // Tax information
    taxInfo: {
        taxId: String,
        taxAmount: Number,
        taxRate: Number,
        country: String,
        region: String
    },
    
    // Timestamps
    processedAt: Date,
    failedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Additional metadata
    metadata: {
        source: String, // web, mobile, api
        ipAddress: String,
        userAgent: String,
        sessionId: String,
        description: String,
        notes: String
    },
    
    // External payment processor details
    processor: {
        name: String, // stripe, paypal, etc.
        transactionId: String,
        chargeId: String,
        refundId: String,
        customerId: String,
        paymentIntentId: String
    }
});

// Generate unique transaction ID before saving
transactionSchema.pre('save', function(next) {
    if (this.isNew && !this.transactionId) {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TXN-${timestamp}-${random}`;
    }
    this.updatedAt = Date.now();
    next();
});

// Index for better query performance
transactionSchema.index({ payer: 1, createdAt: -1 });
transactionSchema.index({ payee: 1, createdAt: -1 });
transactionSchema.index({ booking: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;