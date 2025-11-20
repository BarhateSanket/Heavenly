const express = require("express");
const router = express.Router();

// About page
router.get("/about", (req, res) => {
    res.render("about.ejs");
});

// Contact page
router.get("/contact", (req, res) => {
    res.render("contact.ejs");
});

// Terms of Service page
router.get("/terms-of-service", (req, res) => {
    res.render("terms-of-service.ejs");
});

// Privacy Policy page
router.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy.ejs");
});

// FAQ page
router.get("/faq", (req, res) => {
    res.render("faq.ejs");
});

// Help Center page
router.get("/help-center", (req, res) => {
    res.render("help-center.ejs");
});

// Safety page
router.get("/safety", (req, res) => {
    res.render("safety.ejs");
});

// Cancellation Policy page
router.get("/cancellation-policy", (req, res) => {
    res.render("cancellation-policy.ejs");
});

// Cookie Policy page
router.get("/cookie-policy", (req, res) => {
    res.render("cookie-policy.ejs");
});

// Accessibility page
router.get("/accessibility", (req, res) => {
    res.render("accessibility.ejs");
});

// Sitemap page
router.get("/sitemap", (req, res) => {
    res.render("sitemap.ejs");
});

module.exports = router;
