const mongoose = require('mongoose');
const Listing = require('./Models/listing.js');
require('dotenv').config();

async function createTestListing() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('Connected to MongoDB');

        // Create a test user first (assuming User model exists)
        const User = require('./Models/user.js');
        let testUser = await User.findOne({ username: 'testuser' });
        if (!testUser) {
            testUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123' // This will be hashed by the model
            });
            await testUser.save();
            console.log('Test user created');
        }

        // Create a test listing
        const testListing = new Listing({
            title: 'Beautiful Beach House',
            description: 'A stunning beach house with ocean views',
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            price: 150,
            location: 'Malibu',
            country: 'United States',
            geometry: {
                type: 'Point',
                coordinates: [-118.7798, 34.0259] // Malibu coordinates
            },
            owner: testUser._id,
            maxGuests: 4
        });

        await testListing.save();
        console.log('Test listing created successfully');

        // Create another listing for better map view
        const testListing2 = new Listing({
            title: 'Mountain Cabin',
            description: 'Cozy cabin in the mountains',
            image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800',
            price: 120,
            location: 'Aspen',
            country: 'United States',
            geometry: {
                type: 'Point',
                coordinates: [-106.8175, 39.1911] // Aspen coordinates
            },
            owner: testUser._id,
            maxGuests: 6
        });

        await testListing2.save();
        console.log('Second test listing created successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test listing:', error);
        process.exit(1);
    }
}

createTestListing();
