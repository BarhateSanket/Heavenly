# 🏠 Heavenly - Airbnb Clone

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Express](https://img.shields.io/badge/Express-v4.21-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v8.10-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Tests](https://img.shields.io/badge/Tests-Jest-red.svg)

A full-featured, production-ready property rental platform inspired by Airbnb. Built with modern web technologies and best practices, featuring secure authentication, real-time search, comprehensive API, and extensive testing.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Documentation](#-api-documentation) • [Testing](#-testing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 Overview

**Heavenly** is a sophisticated full-stack web application that replicates core Airbnb functionality. It provides a seamless platform for property owners to list their accommodations and travelers to discover and book their perfect stay. The application emphasizes security, scalability, and user experience.

### Key Highlights

- 🔐 **Secure Authentication** - Passport.js with bcrypt password hashing
- 🎨 **Responsive Design** - Mobile-first approach with custom CSS
- 🚀 **RESTful API** - Complete API for third-party integrations
- 🧪 **Test Coverage** - Comprehensive Jest test suite
- 🛡️ **Production-Ready** - Helmet security, rate limiting, input validation
- 📊 **Advanced Search** - Multi-criteria filtering and pagination

---

## ✨ Features

### User Management
- ✅ **Secure Authentication** - Local strategy with Passport.js
- ✅ **Session Management** - Express-session with secure cookies
- ✅ **Password Encryption** - bcryptjs for secure password hashing
- ✅ **User Authorization** - Role-based access control for listings

### Listings Management
- ✅ **CRUD Operations** - Create, read, update, and delete property listings
- ✅ **Image Uploads** - Support for property images with default fallbacks
- ✅ **Rich Metadata** - Title, description, price, location, country
- ✅ **Ownership Tracking** - Users can only edit/delete their own listings
- ✅ **Pagination** - Browse listings with 12 items per page

### Reviews & Ratings
- ✅ **User Reviews** - Authenticated users can leave reviews
- ✅ **Star Ratings** - 1-5 star rating system
- ✅ **Review Management** - Edit and delete own reviews
- ✅ **Cascade Deletion** - Reviews automatically deleted with listings

### Search & Filtering
- ✅ **Multi-Criteria Search** - Search by title, location, or country
- ✅ **Price Filtering** - Filter listings by price range
- ✅ **Real-Time Results** - Instant search feedback
- ✅ **Query Optimization** - Efficient MongoDB queries

### Security Features
- ✅ **Helmet.js** - Security headers and XSS protection
- ✅ **Rate Limiting** - Prevent abuse with configurable limits
- ✅ **Input Validation** - Joi schema validation
- ✅ **CSRF Protection** - Secure form submissions
- ✅ **HTTP-Only Cookies** - Prevent XSS attacks

### API & Integration
- ✅ **RESTful API** - Complete API for programmatic access
- ✅ **JSON Responses** - Structured API responses
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **API Documentation** - Well-documented endpoints

### User Experience
- ✅ **Flash Messages** - Success and error notifications
- ✅ **Responsive UI** - Works on all device sizes
- ✅ **Clean Design** - Modern, intuitive interface
- ✅ **Loading States** - User feedback during operations

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v18+ | Runtime environment |
| **Express.js** | v4.21 | Web application framework |
| **MongoDB** | v8.10 | NoSQL database |
| **Mongoose** | v8.10 | MongoDB ODM |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| **Passport.js** | v0.7 | Authentication middleware |
| **passport-local** | v1.0 | Local authentication strategy |
| **passport-local-mongoose** | v8.0 | Mongoose plugin for Passport |
| **bcryptjs** | v3.0 | Password hashing |
| **Helmet** | v8.1 | Security headers |
| **express-rate-limit** | v8.2 | Rate limiting |

### Validation & Middleware
| Technology | Version | Purpose |
|------------|---------|---------|
| **Joi** | v17.13 | Schema validation |
| **express-validator** | v7.3 | Request validation |
| **method-override** | v3.0 | HTTP method override |
| **express-session** | v1.18 | Session management |
| **connect-flash** | v0.1 | Flash messages |

### Templating & Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **EJS** | v3.1 | Templating engine |
| **ejs-mate** | v4.0 | Layout support for EJS |
| **Custom CSS** | - | Responsive styling |

### Testing & Development
| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | v30.2 | Testing framework |
| **Supertest** | v7.1 | HTTP assertions |
| **mongodb-memory-server** | v10.3 | In-memory MongoDB for tests |
| **nodemon** | - | Development auto-reload |

### Configuration
| Technology | Version | Purpose |
|------------|---------|---------|
| **dotenv** | v17.2 | Environment variables |

---

## 🏗️ Architecture

### MVC Pattern
The application follows the Model-View-Controller (MVC) architectural pattern:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Routes    │ ◄── Express Router
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │ ◄── Business Logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Models    │ ◄── Mongoose Schemas
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │
└─────────────┘
```

### Middleware Pipeline
```
Request → Rate Limiter → Helmet → Session → Passport → Flash → Routes → Response
```

---

## 📦 Installation

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** v6 or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/heavenly-airbnb-clone.git
   cd heavenly-airbnb-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Session Configuration
   SESSION_SECRET=your-super-secret-key-change-this-in-production
   
   # Environment
   NODE_ENV=development
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Database (Optional - defaults to local MongoDB)
   MONGO_URL=mongodb://127.0.0.1:27017/wanderlust
   
   # Server Port (Optional - defaults to 8080)
   PORT=8080
   ```

4. **Start MongoDB**
   
   Ensure MongoDB is running locally:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Initialize the database (Optional)**
   
   Seed the database with sample data:
   ```bash
   node init/index.js
   ```

6. **Run the application**
   
   **Development mode** (with auto-reload):
   ```bash
   npm run dev
   ```
   
   **Production mode**:
   ```bash
   npm start
   ```

7. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SESSION_SECRET` | Secret key for session encryption | - | ✅ Yes |
| `NODE_ENV` | Environment mode (development/production) | development | ❌ No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window in milliseconds | 900000 (15 min) | ❌ No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | ❌ No |
| `MONGO_URL` | MongoDB connection string | mongodb://127.0.0.1:27017/wanderlust | ❌ No |
| `PORT` | Server port | 8080 | ❌ No |

### Security Configuration

**Helmet CSP Directives:**
- Default sources: `'self'`
- Style sources: Google Fonts, CDN
- Font sources: Google Fonts, CDN
- Script sources: CDN (Bootstrap, etc.)
- Image sources: All HTTPS sources

**Rate Limiting:**
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Returns 429 status when exceeded

---

## 🚀 Usage

### User Workflows

#### 1. **Sign Up & Login**
```
1. Navigate to /signup
2. Enter email, username, and password
3. Submit form → Account created
4. Login at /login with credentials
```

#### 2. **Create a Listing**
```
1. Login to your account
2. Navigate to /listings/new
3. Fill in property details:
   - Title
   - Description
   - Price per night
   - Location
   - Country
   - Image URL (optional)
4. Submit → Listing created
```

#### 3. **Browse & Search Listings**
```
1. Visit /listings
2. Use search bar to filter by:
   - Title
   - Location
   - Country
3. Use price filter for range
4. Navigate pages with pagination
```

#### 4. **View Listing Details**
```
1. Click on any listing card
2. View full details and reviews
3. See location and pricing
4. Read user reviews
```

#### 5. **Leave a Review**
```
1. Login to your account
2. Navigate to a listing
3. Scroll to reviews section
4. Enter rating (1-5 stars) and comment
5. Submit review
```

#### 6. **Edit/Delete Listings**
```
1. Login as listing owner
2. Navigate to your listing
3. Click "Edit" to modify details
4. Or click "Delete" to remove listing
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication
Most endpoints require authentication via session cookies. Login first at `/login`.

### Endpoints

#### **Listings**

##### Get All Listings
```http
GET /api/listings
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by title, location, or country |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Cozy Beach House",
      "description": "Beautiful beachfront property",
      "price": 150,
      "location": "Malibu",
      "country": "United States",
      "image": "https://example.com/image.jpg",
      "owner": "507f1f77bcf86cd799439012",
      "reviews": []
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 60,
    "itemsPerPage": 12
  }
}
```

##### Get Single Listing
```http
GET /api/listings/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Cozy Beach House",
    "description": "Beautiful beachfront property",
    "price": 150,
    "location": "Malibu",
    "country": "United States",
    "image": "https://example.com/image.jpg",
    "owner": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "john_doe"
    },
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "rating": 5,
        "comment": "Amazing place!",
        "author": "jane_doe"
      }
    ]
  }
}
```

##### Create Listing
```http
POST /api/listings
```

**Authentication:** Required

**Request Body:**
```json
{
  "listing": {
    "title": "Mountain Cabin",
    "description": "Peaceful retreat in the mountains",
    "price": 200,
    "location": "Aspen",
    "country": "United States",
    "image": "https://example.com/cabin.jpg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mountain Cabin",
    "owner": "507f1f77bcf86cd799439012"
  },
  "message": "Listing created successfully"
}
```

##### Update Listing
```http
PUT /api/listings/:id
```

**Authentication:** Required (Owner only)

**Request Body:**
```json
{
  "listing": {
    "title": "Updated Title",
    "price": 250
  }
}
```

##### Delete Listing
```http
DELETE /api/listings/:id
```

**Authentication:** Required (Owner only)

**Response:**
```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

#### **Reviews**

##### Get Reviews for Listing
```http
GET /api/listings/:id/reviews
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "rating": 5,
      "comment": "Amazing place!",
      "author": {
        "_id": "507f1f77bcf86cd799439015",
        "username": "jane_doe"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

##### Create Review
```http
POST /api/listings/:id/reviews
```

**Authentication:** Required

**Request Body:**
```json
{
  "review": {
    "rating": 5,
    "comment": "Wonderful experience!"
  }
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🗄️ Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Listing Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  image: String (default: placeholder),
  price: Number (required, min: 0),
  location: String (required),
  country: String (required),
  owner: ObjectId (ref: 'User'),
  reviews: [ObjectId] (ref: 'Review'),
  createdAt: Date,
  updatedAt: Date
}
```

### Review Model
```javascript
{
  _id: ObjectId,
  rating: Number (required, min: 1, max: 5),
  comment: String (required),
  author: ObjectId (ref: 'User'),
  listing: ObjectId (ref: 'Listing'),
  createdAt: Date,
  updatedAt: Date
}
```

### Relationships
```
User ──1:N──> Listing (owner)
User ──1:N──> Review (author)
Listing ──1:N──> Review
```

---

## 🔒 Security

### Implemented Security Measures

1. **Authentication & Authorization**
   - Passport.js local strategy
   - bcrypt password hashing (10 salt rounds)
   - Session-based authentication
   - HTTP-only secure cookies

2. **Input Validation**
   - Joi schema validation for all inputs
   - Express-validator for request validation
   - MongoDB injection prevention

3. **Security Headers**
   - Helmet.js for security headers
   - Content Security Policy (CSP)
   - XSS protection
   - MIME type sniffing prevention

4. **Rate Limiting**
   - Configurable rate limits per IP
   - Default: 100 requests per 15 minutes
   - Prevents brute force attacks

5. **Session Security**
   - Secure session configuration
   - HTTP-only cookies
   - HTTPS-only in production
   - 30-day session expiration

6. **Error Handling**
   - Custom error classes
   - No sensitive data in error messages
   - Proper HTTP status codes

### Security Best Practices

- ✅ Never commit `.env` file
- ✅ Use strong `SESSION_SECRET` in production
- ✅ Enable HTTPS in production
- ✅ Regular dependency updates
- ✅ Input sanitization
- ✅ CSRF protection on forms
- ✅ SQL/NoSQL injection prevention

---

## 🧪 Testing

### Test Suite Overview

The application includes comprehensive testing using Jest and Supertest.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Watch mode (auto-rerun on changes):**
```bash
npm run test:watch
```

**Coverage report:**
```bash
npm run test:coverage
```

### Test Structure

```
tests/
├── setup.js           # Test configuration and utilities
└── listings.test.js   # Listing endpoints tests
```

### Test Coverage

- ✅ **API Endpoints** - All CRUD operations
- ✅ **Authentication** - Login/logout flows
- ✅ **Authorization** - Permission checks
- ✅ **Validation** - Input validation
- ✅ **Error Handling** - Error responses
- ✅ **Database Operations** - CRUD operations

### Sample Test Output

```
PASS  tests/listings.test.js
  Listings API
    ✓ GET /api/listings - should return all listings (45ms)
    ✓ GET /api/listings/:id - should return single listing (32ms)
    ✓ POST /api/listings - should create new listing (28ms)
    ✓ PUT /api/listings/:id - should update listing (35ms)
    ✓ DELETE /api/listings/:id - should delete listing (30ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        2.5s
```

---

## 📁 Project Structure

```
Heavenly/
│
├── Models/                    # Mongoose schemas
│   ├── listing.js            # Listing model
│   ├── review.js             # Review model
│   └── user.js               # User model
│
├── routes/                    # Express routes
│   ├── api.js                # API endpoints
│   ├── listings.js           # Listing routes
│   ├── review.js             # Review routes
│   └── user.js               # User authentication routes
│
├── views/                     # EJS templates
│   ├── layouts/              # Layout templates
│   │   └── boilerplate.ejs   # Main layout
│   ├── includes/             # Partial templates
│   │   ├── navbar.ejs        # Navigation bar
│   │   ├── footer.ejs        # Footer
│   │   └── flash.ejs         # Flash messages
│   ├── listings/             # Listing views
│   │   ├── index.ejs         # All listings
│   │   ├── show.ejs          # Single listing
│   │   ├── new.ejs           # Create listing
│   │   └── edit.ejs          # Edit listing
│   ├── users/                # User views
│   │   ├── login.ejs         # Login page
│   │   └── signup.ejs        # Signup page
│   └── error.ejs             # Error page
│
├── Public/                    # Static assets
│   ├── css/
│   │   └── style.css         # Custom styles
│   └── js/
│       └── script.js         # Client-side JavaScript
│
├── utils/                     # Utility functions
│   ├── ExpressError.js       # Custom error class
│   └── wrapasync.js          # Async error wrapper
│
├── tests/                     # Test files
│   ├── setup.js              # Test configuration
│   └── listings.test.js      # Listing tests
│
├── init/                      # Database initialization
│   ├── data.js               # Sample data
│   └── index.js              # Seed script
│
├── assets/                    # Project assets
│
├── app.js                     # Main application file
├── middleware.js              # Custom middleware
├── schema.js                  # Joi validation schemas
├── jest.config.js             # Jest configuration
├── package.json               # Dependencies
├── .env                       # Environment variables (not in repo)
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/BarhateSanket/heavenly.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features

4. **Run tests**
   ```bash
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues

### Code Style

- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

---

## 🗺️ Roadmap

### Planned Features

#### Phase 1 - Core Enhancements
- [ ] Image upload functionality (Cloudinary integration)
- [ ] Advanced search with filters (amenities, guests, dates)
- [ ] Booking system with calendar
- [ ] Payment integration (Stripe)
- [ ] Email notifications (SendGrid)

#### Phase 2 - User Experience
- [ ] User profiles with avatars
- [ ] Wishlist/favorites functionality
- [ ] Messaging system between users
- [ ] Booking history and management
- [ ] Review photos

#### Phase 3 - Advanced Features
- [ ] Map integration (Google Maps/Mapbox)
- [ ] Real-time availability
- [ ] Multi-language support (i18n)
- [ ] Social media authentication (OAuth)
- [ ] Admin dashboard

#### Phase 4 - Performance & Scale
- [ ] Redis caching
- [ ] CDN integration
- [ ] Database optimization
- [ ] Load balancing
- [ ] Microservices architecture

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Heavenly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support & Contact

### Getting Help

- 📖 **Documentation**: Read this README thoroughly
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Open an issue with [Feature Request] tag
- 💬 **Discussions**: Use GitHub Discussions

### Links

- **Repository**: [GitHub](https://github.com/yourusername/heavenly-airbnb-clone)
- **Issues**: [Issue Tracker](https://github.com/yourusername/heavenly-airbnb-clone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/heavenly-airbnb-clone/discussions)

---

## 🙏 Acknowledgments

- Inspired by [Airbnb](https://www.airbnb.com)
- Built with guidance from web development best practices
- Thanks to all contributors and the open-source community

---

<div align="center">

**Made with ❤️ by the Heavenly Team**

⭐ Star this repo if you find it helpful!

</div>
