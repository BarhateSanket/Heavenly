// Test setup file
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust-test';

// Clear mongoose models and connections before each test to avoid overwrite errors
const mongoose = require('mongoose');

beforeAll(async () => {
    // Disconnect any existing connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
});

beforeEach(async () => {
    // Clear all models to prevent overwrite errors
    delete mongoose.models.Listing;
    delete mongoose.models.User;
    delete mongoose.models.Review;
    delete mongoose.modelSchemas.Listing;
    delete mongoose.modelSchemas.User;
    delete mongoose.modelSchemas.Review;

    // Clear require cache for model files
    delete require.cache[require.resolve('../models/listing')];
    delete require.cache[require.resolve('../models/user')];
    delete require.cache[require.resolve('../models/review')];
});

afterEach(async () => {
    // Clean up after each test
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
});

afterAll(async () => {
    // Final cleanup
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
});
