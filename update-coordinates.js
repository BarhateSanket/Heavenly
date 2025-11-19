const mongoose = require('mongoose');
const Listing = require('./Models/listing.js');
require('dotenv').config();

// Coordinates for various locations
const locationCoordinates = {
    'New York City': [-74.0060, 40.7128],
    'Malibu': [-118.7798, 34.0259],
    'Aspen': [-106.8175, 39.1911],
    'Lake Tahoe': [-120.0324, 39.0968],
    'Cancun': [-86.8515, 21.1619],
    'Los Angeles': [-118.2437, 34.0522],
    'Florence': [11.2558, 43.7696],
    'Portland': [-122.6784, 45.5152],
    'Verbier': [7.2286, 46.0964],
    'Amsterdam': [4.9041, 52.3676],
    'Fiji': [178.0650, -17.7134],
    'Serengeti National Park': [34.8333, -2.3333],
    'Tanzania': [34.8333, -2.3333] // Default for Tanzania
};

async function updateCoordinates() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('Connected to MongoDB');

        const listings = await Listing.find({});
        console.log(`Found ${listings.length} listings to update`);

        for (const listing of listings) {
            const coords = locationCoordinates[listing.location];
            if (coords) {
                listing.geometry.coordinates = coords;
                await listing.save();
                console.log(`Updated ${listing.title} with coordinates: ${coords}`);
            } else {
                console.log(`No coordinates found for ${listing.location}, keeping default`);
            }
        }

        console.log('Coordinates update completed');
        process.exit(0);
    } catch (error) {
        console.error('Error updating coordinates:', error);
        process.exit(1);
    }
}

updateCoordinates();
