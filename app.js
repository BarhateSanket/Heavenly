require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRoutes = require("./routes/listings.js");
const reviewRoutes = require("./routes/review.js");
const commentRoutes = require("./routes/comments.js");
const userRoutes = require("./routes/user.js");
const bookingRoutes = require("./routes/bookings.js");
const messageRoutes = require("./routes/messages.js");
const adminRoutes = require("./routes/admin.js");
const apiRoutes = require("./routes/api.js");
const wishlistRoutes = require("./routes/wishlists.js");
const activityRoutes = require("./routes/activities.js");
const notificationRoutes = require("./routes/notifications.js");
const premiumRoutes = require("./routes/premium.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./Models/user");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");



const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "Public")));
app.use(express.static(path.join(__dirname, "assets")));
app.engine("ejs", ejsMate);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);


const sessionOptions = {
    secret: process.env.SESSION_SECRET || "thisisnotagoodsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    }
};

app.get("/", (req, res) => {
    res.send("I am root");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    // Add activity helpers to all views
    const { getActivityText, renderActivityTarget, getTimeAgo } = require("./utils/activityHelpers");
    res.locals.getActivityText = getActivityText;
    res.locals.renderActivityTarget = renderActivityTarget;
    res.locals.timeAgo = getTimeAgo;
    next();
});


app.use("/api", apiRoutes);
app.use("/listings", listingRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/listings/:id/comments", commentRoutes);
app.use("/messages", messageRoutes);
app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);
app.use("/wishlists", wishlistRoutes);
app.use("/activities", activityRoutes);
app.use("/notifications", notificationRoutes);
app.use("/premium", premiumRoutes);
app.use("/", userRoutes);

// Socket.io integration
io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.passport && session.passport.user) {
        socket.userId = session.passport.user;
        next();
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    if (socket.userId) {
        socket.join(socket.userId);
        console.log(`User ${socket.userId} connected for notifications`);
    }

    socket.on('disconnect', () => {
        console.log('User disconnected from notifications');
    });
});

// Make io available globally
app.set('io', io);

// Export io for use in models
module.exports.io = io;

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", {message});
    // res.status(statusCode).send(message);
});

server.listen(8000, () => {
  console.log("Server is running on port 8000");
  console.log("Port 8000 is now available and ready");
  console.log("Development server started successfully");
  console.log("Server ready to accept connections");
});



app.get("/testlisting", async (req, res) => {
  try {
    const Listing = require("./Models/listing");
    // Check if a listing with this title already exists
    const existingListing = await Listing.findOne({ title: "Heavenly-Airbnb Clone" });

    if (!existingListing) {
      let sampleListing = new Listing({
        title: "Heavenly-Airbnb Clone",
        description: "This is a sample listing for the Heavenly-Airbnb Clone",
        price: 100,
        location: "Heavenly",
        country: "United States",
        geometry: { type: "Point", coordinates: [-118.7767, 36.6010] }, // Example coordinates for Heavenly, CA
        image: "https://via.placeholder.com/600x400?text=Heavenly+Listing"
      });
      await sampleListing.save();
      console.log("sample Listing saved");
      res.send("Successfully saved sample listing");
    } else {
      res.send("Sample listing already exists!");
    }
  } catch (err) {
    console.log(err);
    res.send("Error creating sample listing");
  }
});

// Dummy comment to trigger nodemon restart
// Another dummy
