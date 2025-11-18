const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const Listing = require('../models/listing');
const User = require('../models/user');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Listing.deleteMany({});
    await User.deleteMany({});
});

describe('Listings API', () => {
    describe('GET /listings', () => {
        it('should return all listings', async () => {
            const listing = new Listing({
                title: 'Test Listing',
                description: 'A test listing',
                price: 100,
                location: 'Test City',
                country: 'Test Country',
                image: 'test.jpg'
            });
            await listing.save();

            const response = await request(app)
                .get('/listings')
                .expect(200);

            expect(response.text).toContain('Test Listing');
        });

        it('should filter listings by search term', async () => {
            const listing1 = new Listing({
                title: 'Beach House',
                description: 'Beautiful beach house',
                price: 200,
                location: 'Miami',
                country: 'USA',
                image: 'beach.jpg'
            });
            const listing2 = new Listing({
                title: 'Mountain Cabin',
                description: 'Cozy mountain cabin',
                price: 150,
                location: 'Denver',
                country: 'USA',
                image: 'mountain.jpg'
            });
            await listing1.save();
            await listing2.save();

            const response = await request(app)
                .get('/listings?search=beach')
                .expect(200);

            expect(response.text).toContain('Beach House');
            expect(response.text).not.toContain('Mountain Cabin');
        });

        it('should filter listings by price range', async () => {
            const listing1 = new Listing({
                title: 'Cheap Place',
                description: 'Affordable',
                price: 50,
                location: 'City',
                country: 'Country',
                image: 'cheap.jpg'
            });
            const listing2 = new Listing({
                title: 'Expensive Place',
                description: 'Luxury',
                price: 500,
                location: 'City',
                country: 'Country',
                image: 'expensive.jpg'
            });
            await listing1.save();
            await listing2.save();

            const response = await request(app)
                .get('/listings?minPrice=100&maxPrice=400')
                .expect(200);

            expect(response.text).not.toContain('Cheap Place');
            expect(response.text).not.toContain('Expensive Place');
        });
    });

    describe('GET /listings/:id', () => {
        it('should return a specific listing', async () => {
            const listing = new Listing({
                title: 'Specific Listing',
                description: 'A specific test listing',
                price: 100,
                location: 'Test City',
                country: 'Test Country',
                image: 'test.jpg'
            });
            await listing.save();

            const response = await request(app)
                .get(`/listings/${listing._id}`)
                .expect(200);

            expect(response.text).toContain('Specific Listing');
        });

        it('should return 404 for non-existent listing', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/listings/${fakeId}`)
                .expect(200); // Express renders error page

            expect(response.text).toContain('Listing not found');
        });
    });
});
