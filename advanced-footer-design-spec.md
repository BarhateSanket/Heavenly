# Advanced Footer Design Specification
## Heavenly Vacation Rental Platform

### Executive Summary
The current footer is minimal and lacks essential information that users expect from a professional vacation rental platform. This specification outlines a comprehensive, modern footer that enhances user experience, provides essential information, and aligns with the site's sophisticated design system.

---

## Current Footer Analysis

### Existing Structure
```html
<footer>
    <div class="f-info">
        <div class="f-info-socials">
            <i class="fa-brands fa-square-facebook"></i>
            <i class="fa-brands fa-square-instagram"></i>
            <i class="fa-brands fa-square-twitter"></i>
        </div>
        <br />
        <div class="f-info-copyright">&copy; 2025 Heavenly Pvt Ltd</div>
        <div class="f-info-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
        </div>
    </div>
</footer>
```

### Limitations
- **Minimal Information**: Only social media and basic legal links
- **No Company Details**: Missing contact information, address, business hours
- **No User Resources**: No help center, support, or user assistance links
- **No Marketing Elements**: Missing newsletter signup, promotional content
- **Poor User Experience**: No quick navigation or search functionality
- **Not Mobile-Optimized**: Basic layout doesn't scale well for mobile devices

---

## New Footer Design Structure

### Layout Overview
The new footer will feature a **4-column responsive layout** with distinct sections:

1. **Company Information** - Logo, mission, contact details
2. **Quick Navigation** - Site sections and user resources
3. **Support & Legal** - Help center, policies, contact
4. **Newsletter & Social** - Subscription form and social media presence

### Visual Hierarchy
- **Primary Section**: Newsletter subscription (most important marketing element)
- **Secondary Sections**: Company info and navigation (informational)
- **Tertiary Elements**: Social media and legal links (compliance)

---

## HTML Structure Specification

```html
<footer class="advanced-footer" role="contentinfo">
    <!-- Newsletter Section -->
    <div class="footer-newsletter-section">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8 col-lg-6">
                    <div class="newsletter-content">
                        <h3 class="newsletter-title">Stay in the loop</h3>
                        <p class="newsletter-subtitle">Get the latest listings, travel tips, and exclusive deals delivered to your inbox</p>
                    </div>
                </div>
                <div class="col-md-4 col-lg-6">
                    <form class="newsletter-form" aria-label="Newsletter subscription form">
                        <div class="input-group">
                            <input 
                                type="email" 
                                class="form-control newsletter-input" 
                                placeholder="Enter your email address"
                                aria-label="Email address"
                                required
                            >
                            <button 
                                type="submit" 
                                class="btn btn-primary newsletter-btn"
                                aria-label="Subscribe to newsletter"
                            >
                                <span class="btn-text">Subscribe</span>
                                <i class="fas fa-paper-plane btn-icon"></i>
                            </button>
                        </div>
                        <small class="form-text privacy-note">
                            <i class="fas fa-lock"></i>
                            We respect your privacy. Unsubscribe at any time.
                        </small>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Footer Content -->
    <div class="footer-main-content">
        <div class="container">
            <div class="row">
                <!-- Company Information Column -->
                <div class="col-lg-3 col-md-6">
                    <section class="footer-section" aria-labelledby="company-info-heading">
                        <h4 id="company-info-heading" class="footer-section-title">
                            <img src="/Public/logo.png" alt="Heavenly Logo" class="footer-logo">
                            Heavenly
                        </h4>
                        <p class="company-description">
                            Discover extraordinary accommodations around the world. From cozy cabins to luxury villas, we help you find your perfect getaway.
                        </p>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <div class="contact-details">
                                    <span class="contact-label">Address</span>
                                    <span class="contact-value">123 Travel Street, Vacation City, VC 12345</span>
                                </div>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-phone"></i>
                                <div class="contact-details">
                                    <span class="contact-label">Phone</span>
                                    <a href="tel:+1-555-0123" class="contact-link">+1 (555) 012-3456</a>
                                </div>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <div class="contact-details">
                                    <span class="contact-label">Email</span>
                                    <a href="mailto:hello@heavenly.com" class="contact-link">hello@heavenly.com</a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Quick Navigation Column -->
                <div class="col-lg-3 col-md-6">
                    <nav class="footer-section" aria-labelledby="quick-nav-heading">
                        <h4 id="quick-nav-heading" class="footer-section-title">Explore</h4>
                        <ul class="footer-nav-list">
                            <li><a href="/listings" class="footer-nav-link">Browse All Listings</a></li>
                            <li><a href="/listings?category=beach" class="footer-nav-link">Beachfront Homes</a></li>
                            <li><a href="/listings?category=mountain" class="footer-nav-link">Mountain Retreats</a></li>
                            <li><a href="/listings?category=city" class="footer-nav-link">Urban Escapes</a></li>
                            <li><a href="/listings?category=cabin" class="footer-nav-link">Cozy Cabins</a></li>
                            <li><a href="/listings/new" class="footer-nav-link highlight-link">Become a Host</a></li>
                        </ul>
                    </nav>
                </div>

                <!-- Support & Legal Column -->
                <div class="col-lg-3 col-md-6">
                    <section class="footer-section" aria-labelledby="support-heading">
                        <h4 id="support-heading" class="footer-section-title">Support & Help</h4>
                        <ul class="footer-nav-list">
                            <li><a href="/help-center" class="footer-nav-link">Help Center</a></li>
                            <li><a href="/contact" class="footer-nav-link">Contact Us</a></li>
                            <li><a href="/faq" class="footer-nav-link">Frequently Asked Questions</a></li>
                            <li><a href="/safety" class="footer-nav-link">Safety Information</a></li>
                            <li><a href="/cancellation-policy" class="footer-nav-link">Cancellation Policy</a></li>
                        </ul>
                        
                        <h5 class="footer-subsection-title">Legal</h5>
                        <ul class="footer-nav-list">
                            <li><a href="/privacy-policy" class="footer-nav-link">Privacy Policy</a></li>
                            <li><a href="/terms-of-service" class="footer-nav-link">Terms of Service</a></li>
                            <li><a href="/cookie-policy" class="footer-nav-link">Cookie Policy</a></li>
                        </ul>
                    </section>
                </div>

                <!-- Social Media & App Download Column -->
                <div class="col-lg-3 col-md-6">
                    <section class="footer-section" aria-labelledby="connect-heading">
                        <h4 id="connect-heading" class="footer-section-title">Connect With Us</h4>
                        
                        <!-- Social Media Links -->
                        <div class="social-media-section">
                            <p class="social-media-text">Follow us on social media for travel inspiration and updates</p>
                            <div class="social-media-links">
                                <a href="https://facebook.com/heavenly" class="social-link facebook" aria-label="Follow us on Facebook">
                                    <i class="fab fa-facebook-f"></i>
                                    <span class="social-text">Facebook</span>
                                </a>
                                <a href="https://instagram.com/heavenly" class="social-link instagram" aria-label="Follow us on Instagram">
                                    <i class="fab fa-instagram"></i>
                                    <span class="social-text">Instagram</span>
                                </a>
                                <a href="https://twitter.com/heavenly" class="social-link twitter" aria-label="Follow us on Twitter">
                                    <i class="fab fa-twitter"></i>
                                    <span class="social-text">Twitter</span>
                                </a>
                                <a href="https://linkedin.com/company/heavenly" class="social-link linkedin" aria-label="Follow us on LinkedIn">
                                    <i class="fab fa-linkedin-in"></i>
                                    <span class="social-text">LinkedIn</span>
                                </a>
                            </div>
                        </div>

                        <!-- Business Hours -->
                        <div class="business-hours">
                            <h5 class="footer-subsection-title">Customer Service Hours</h5>
                            <div class="hours-list">
                                <div class="hours-item">
                                    <span class="hours-day">Monday - Friday</span>
                                    <span class="hours-time">9:00 AM - 8:00 PM EST</span>
                                </div>
                                <div class="hours-item">
                                    <span class="hours-day">Saturday - Sunday</span>
                                    <span class="hours-time">10:00 AM - 6:00 PM EST</span>
                                </div>
                                <div class="hours-item">
                                    <span class="hours-day">Holidays</span>
                                    <span class="hours-time">10:00 AM - 4:00 PM EST</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer Bottom -->
    <div class="footer-bottom">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="footer-copyright">
                        <p>&copy; <span class="current-year">2025</span> Heavenly Pvt Ltd. All rights reserved.</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="footer-bottom-links">
                        <a href="/sitemap" class="bottom-link">Sitemap</a>
                        <span class="separator">•</span>
                        <a href="/accessibility" class="bottom-link">Accessibility</a>
                        <span class="separator">•</span>
                        <div class="theme-toggle-wrapper">
                            <button id="theme-toggle-footer" class="theme-toggle" aria-label="Toggle theme">
                                <i class="fas fa-sun theme-icon-light"></i>
                                <i class="fas fa-moon theme-icon-dark"></i>
                                <span class="theme-text">Light</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>
```

---

## CSS Classes and Styling Specification

### Core Layout Classes

```css
/* ===== FOOTER MAIN STRUCTURE ===== */
.advanced-footer {
    background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
    border-top: 1px solid var(--color-border-light);
    margin-top: auto;
    box-shadow: var(--shadow-lg);
}

/* Newsletter Section */
.footer-newsletter-section {
    background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%);
    padding: var(--spacing-12) 0;
    color: var(--color-text-inverse);
}

.newsletter-content {
    padding-right: var(--spacing-8);
}

.newsletter-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-3);
    color: var(--color-text-inverse);
}

.newsletter-subtitle {
    font-size: var(--font-size-lg);
    opacity: 0.9;
    margin-bottom: 0;
}

.newsletter-form {
    max-width: 100%;
}

.newsletter-input {
    border-radius: var(--border-radius-lg) 0 0 var(--border-radius-lg);
    border: none;
    padding: var(--spacing-4) var(--spacing-5);
    font-size: var(--font-size-base);
    background: var(--color-bg-primary);
}

.newsletter-input:focus {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
    outline: none;
}

.newsletter-btn {
    border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-neutral-900);
    border: none;
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
}

.newsletter-btn:hover {
    background: var(--color-neutral-800);
    transform: translateY(-1px);
}

.newsletter-btn .btn-icon {
    margin-left: var(--spacing-2);
    transition: transform var(--transition-fast);
}

.newsletter-btn:hover .btn-icon {
    transform: translateX(2px);
}

.privacy-note {
    margin-top: var(--spacing-2);
    opacity: 0.8;
    font-size: var(--font-size-sm);
}

/* Main Footer Content */
.footer-main-content {
    padding: var(--spacing-16) 0 var(--spacing-12);
}

.footer-section {
    margin-bottom: var(--spacing-12);
}

.footer-section-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-6);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.footer-logo {
    height: 2rem;
    width: auto;
}

.footer-subsection-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: var(--spacing-8) 0 var(--spacing-4);
}

/* Company Information Styling */
.company-description {
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-6);
}

.contact-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.contact-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
}

.contact-item i {
    color: var(--color-primary-500);
    width: 1.25rem;
    margin-top: var(--spacing-1);
    flex-shrink: 0;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.contact-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

.contact-value {
    color: var(--color-text-primary);
}

.contact-link {
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
}

.contact-link:hover {
    color: var(--color-primary-500);
    text-decoration: none;
}

/* Navigation Lists */
.footer-nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.footer-nav-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--font-size-base);
    transition: all var(--transition-fast);
    padding: var(--spacing-1) 0;
    border-radius: var(--border-radius-base);
    position: relative;
}

.footer-nav-link:hover {
    color: var(--color-primary-500);
    text-decoration: none;
    padding-left: var(--spacing-3);
    background: var(--color-bg-secondary);
}

.footer-nav-link.highlight-link {
    color: var(--color-primary-500);
    font-weight: var(--font-weight-semibold);
}

.footer-nav-link.highlight-link::before {
    content: "→";
    position: absolute;
    left: 0;
    opacity: 0;
    transition: all var(--transition-fast);
}

.footer-nav-link.highlight-link:hover::before {
    opacity: 1;
    left: var(--spacing-1);
}

/* Social Media Section */
.social-media-section {
    margin-bottom: var(--spacing-8);
}

.social-media-text {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-4);
    font-size: var(--font-size-sm);
}

.social-media-links {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.social-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--border-radius-lg);
    text-decoration: none;
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
    border: 1px solid transparent;
}

.social-link:hover {
    text-decoration: none;
    transform: translateX(4px);
}

.social-link.facebook:hover {
    background: #1877f2;
    color: white;
    border-color: #1877f2;
}

.social-link.instagram:hover {
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    color: white;
}

.social-link.twitter:hover {
    background: #1da1f2;
    color: white;
    border-color: #1da1f2;
}

.social-link.linkedin:hover {
    background: #0077b5;
    color: white;
    border-color: #0077b5;
}

.social-text {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

/* Business Hours */
.hours-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.hours-item {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-border-light);
}

.hours-item:last-child {
    border-bottom: none;
}

.hours-day {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

.hours-time {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
}

/* Footer Bottom */
.footer-bottom {
    background: var(--color-bg-tertiary);
    border-top: 1px solid var(--color-border-light);
    padding: var(--spacing-6) 0;
}

.footer-copyright p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.footer-bottom-links {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-3);
    flex-wrap: wrap;
}

.bottom-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition: color var(--transition-fast);
}

.bottom-link:hover {
    color: var(--color-primary-500);
    text-decoration: none;
}

.separator {
    color: var(--color-border-medium);
    font-size: var(--font-size-sm);
}

.theme-toggle-wrapper {
    display: flex;
    align-items: center;
}

.theme-toggle {
    background: none;
    border: 1px solid var(--color-border-medium);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-2) var(--spacing-3);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
}

.theme-toggle:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary-500);
    color: var(--color-primary-500);
}

/* Responsive Design */
@media (max-width: 991.98px) {
    .footer-main-content {
        padding: var(--spacing-12) 0 var(--spacing-8);
    }
    
    .newsletter-content {
        margin-bottom: var(--spacing-8);
        padding-right: 0;
        text-align: center;
    }
    
    .footer-bottom-links {
        justify-content: center;
        margin-top: var(--spacing-4);
    }
    
    .footer-copyright {
        text-align: center;
        margin-bottom: var(--spacing-4);
    }
}

@media (max-width: 767.98px) {
    .footer-newsletter-section {
        padding: var(--spacing-8) 0;
    }
    
    .newsletter-title {
        font-size: var(--font-size-2xl);
        text-align: center;
    }
    
    .newsletter-subtitle {
        text-align: center;
        margin-bottom: var(--spacing-6);
    }
    
    .newsletter-form {
        max-width: 100%;
    }
    
    .newsletter-input {
        border-radius: var(--border-radius-lg);
        margin-bottom: var(--spacing-3);
    }
    
    .newsletter-btn {
        width: 100%;
        border-radius: var(--border-radius-lg);
    }
    
    .social-link .social-text {
        display: none;
    }
    
    .social-link {
        justify-content: center;
        padding: var(--spacing-3);
        width: 3rem;
        height: 3rem;
    }
    
    .footer-section {
        margin-bottom: var(--spacing-8);
    }
    
    .hours-item {
        flex-direction: column;
        gap: var(--spacing-1);
        text-align: center;
    }
}

@media (max-width: 575.98px) {
    .footer-newsletter-section {
        padding: var(--spacing-6) 0;
    }
    
    .footer-main-content {
        padding: var(--spacing-8) 0;
    }
    
    .contact-item {
        text-align: center;
        flex-direction: column;
        align-items: center;
    }
    
    .footer-bottom-links {
        justify-content: center;
        text-align: center;
    }
}

/* Dark Mode Overrides */
[data-theme="dark"] .footer-newsletter-section {
    background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
}

[data-theme="dark"] .newsletter-btn {
    background: var(--color-neutral-100);
    color: var(--color-neutral-900);
}

[data-theme="dark"] .newsletter-btn:hover {
    background: var(--color-neutral-200);
}

/* Animation Classes */
.footer-section {
    animation: fadeInUp 0.6s ease-out;
}

.footer-section:nth-child(1) { animation-delay: 0.1s; }
.footer-section:nth-child(2) { animation-delay: 0.2s; }
.footer-section:nth-child(3) { animation-delay: 0.3s; }
.footer-section:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Focus States for Accessibility */
.footer-nav-link:focus,
.social-link:focus,
.contact-link:focus,
.bottom-link:focus {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
}

.newsletter-input:focus {
    outline: 2px solid var(--color-text-inverse);
    outline-offset: 2px;
}

/* Print Styles */
@media print {
    .footer-newsletter-section,
    .social-media-section {
        display: none;
    }
    
    .footer-section {
        break-inside: avoid;
        margin-bottom: var(--spacing-4);
    }
}
```

---

## JavaScript Functionality Specification

### Newsletter Form Handling

```javascript
class NewsletterFormHandler {
    constructor() {
        this.form = document.querySelector('.newsletter-form');
        this.input = this.form.querySelector('.newsletter-input');
        this.button = this.form.querySelector('.newsletter-btn');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.input.addEventListener('input', this.handleInput.bind(this));
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const email = this.input.value.trim();
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.setLoadingState(true);
        
        try {
            // Simulate API call
            const response = await this.subscribeToNewsletter(email);
            
            if (response.success) {
                this.showSuccess('Successfully subscribed to our newsletter!');
                this.form.reset();
            } else {
                throw new Error(response.message || 'Subscription failed');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    handleInput(event) {
        const email = event.target.value;
        
        // Real-time email validation feedback
        if (email.length > 0) {
            if (this.isValidEmail(email)) {
                this.input.classList.remove('is-invalid');
                this.input.classList.add('is-valid');
            } else {
                this.input.classList.remove('is-valid');
                this.input.classList.add('is-invalid');
            }
        } else {
            this.input.classList.remove('is-valid', 'is-invalid');
        }
    }

    async subscribeToNewsletter(email) {
        // Simulate API request
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate success (90% success rate)
                const success = Math.random() > 0.1;
                resolve({
                    success: success,
                    message: success ? '' : 'This email is already subscribed'
                });
            }, 1000);
        });
    }

    setLoadingState(loading) {
        if (loading) {
            this.button.disabled = true;
            this.button.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i> Subscribing...';
        } else {
            this.button.disabled = false;
            this.button.innerHTML = '<span class="btn-text">Subscribe</span><i class="fas fa-paper-plane btn-icon"></i>';
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = this.form.querySelector('.newsletter-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.className = `newsletter-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Insert message after form
        this.form.parentNode.insertBefore(messageEl, this.form.nextSibling);

        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
```

### Theme Toggle Enhancement

```javascript
class FooterThemeToggle {
    constructor() {
        this.button = document.getElementById('theme-toggle-footer');
        this.init();
    }

    init() {
        if (this.button) {
            this.button.addEventListener('click', this.toggleTheme.bind(this));
            this.updateButtonText();
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save preference
        localStorage.setItem('theme', newTheme);
        
        // Update button text
        this.updateButtonText();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        }));
    }

    updateButtonText() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const textElement = this.button.querySelector('.theme-text');
        
        if (textElement) {
            textElement.textContent = currentTheme === 'dark' ? 'Dark' : 'Light';
        }
    }
}
```

### Dynamic Copyright Year

```javascript
class CopyrightUpdater {
    constructor() {
        this.yearElement = document.querySelector('.current-year');
        this.updateYear();
    }

    updateYear() {
        if (this.yearElement) {
            this.yearElement.textContent = new Date().getFullYear();
        }
    }
}
```

### Accessibility Enhancements

```javascript
class FooterAccessibility {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupAnnouncements();
        this.setupReducedMotion();
    }

    setupKeyboardNavigation() {
        const focusableElements = document.querySelectorAll(
            '.advanced-footer a, .advanced-footer button, .advanced-footer input'
        );

        focusableElements.forEach(element => {
            element.addEventListener('keydown', this.handleKeyboardNav.bind(this));
        });
    }

    handleKeyboardNav(event) {
        // Enhanced keyboard navigation for footer elements
        if (event.key === 'Tab') {
            // Ensure proper tab order
            this.ensureFocusOrder(event.target);
        }
    }

    ensureFocusOrder(element) {
        // Logic to ensure logical tab order through footer sections
        const footer = element.closest('.advanced-footer');
        if (!footer) return;

        // Add visual indicators for keyboard navigation
        element.addEventListener('focus', () => {
            element.classList.add('keyboard-focused');
        });

        element.addEventListener('blur', () => {
            element.classList.remove('keyboard-focused');
        });
    }

    setupAnnouncements() {
        // Setup live regions for dynamic content announcements
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.id = 'footer-announcer';
        document.body.appendChild(announcer);
    }

    announceToScreenReader(message) {
        const announcer = document.getElementById('footer-announcer');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    setupReducedMotion() {
        // Respect user's motion preferences
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');
        }
    }
}
```

---

## Feature Justification and Reasoning

### 1. Multi-Column Layout
**Purpose**: Organize information hierarchically and improve scanability
**Benefits**:
- Reduces cognitive load by grouping related information
- Improves mobile experience through responsive stacking
- Creates visual hierarchy that guides user attention
- Allows for scalable content addition

### 2. Newsletter Subscription Section
**Purpose**: Lead generation and user engagement
**Benefits**:
- Primary call-to-action for marketing
- Builds email list for promotional campaigns
- Increases user retention through regular communication
- Positions footer as functional, not just informational

### 3. Enhanced Company Information
**Purpose**: Build trust and provide essential business details
**Benefits**:
- Establishes credibility and professionalism
- Provides multiple contact channels
- Helps users make informed decisions
- Meets business directory requirements

### 4. Quick Navigation Links
**Purpose**: Improve site usability and reduce bounce rate
**Benefits**:
- Directs users to popular sections
- Reduces need to navigate through main menu
- Increases engagement with key features
- Improves SEO through internal linking

### 5. Enhanced Social Media Integration
**Purpose**: Extend brand presence and community building
**Benefits**:
- Increases brand visibility across platforms
- Drives traffic from social media channels
- Builds community around the brand
- Provides additional support channels

### 6. Business Hours Display
**Purpose**: Set proper user expectations for support availability
**Benefits**:
- Reduces support ticket volume
- Improves customer service experience
- Builds trust through transparency
- Helps users plan their inquiries

### 7. Accessibility Features
**Purpose**: Ensure inclusive design for all users
**Benefits**:
- Complies with WCAG guidelines
- Improves SEO through semantic HTML
- Enhances user experience for disabled users
- Reduces legal risk

### 8. Responsive Design
**Purpose**: Provide optimal experience across all devices
**Benefits**:
- Serves mobile-first audience (60%+ of traffic)
- Improves Google search rankings
- Reduces bounce rate on mobile devices
- Future-proofs the design

### 9. Theme Integration
**Purpose**: Maintain consistency with site-wide features
**Benefits**:
- Preserves user theme preferences
- Maintains design consistency
- Enhances user experience
- Demonstrates attention to detail

### 10. Animation and Visual Polish
**Purpose**: Create engaging, professional appearance
**Benefits**:
- Improves perceived performance
- Creates premium feel
- Enhances user engagement
- Differentiates from competitor footers

---

## Implementation Guidelines

### Phase 1: Core Structure
1. Replace existing footer HTML with new structure
2. Implement basic CSS for layout and typography
3. Test responsive behavior across devices

### Phase 2: Interactive Features
1. Add JavaScript for newsletter form
2. Implement theme toggle integration
3. Add accessibility enhancements

### Phase 3: Polish and Optimization
1. Add animations and micro-interactions
2. Optimize performance and loading
3. Conduct accessibility audit
4. Test across browsers and devices

### Testing Requirements
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Device testing**: Mobile, tablet, desktop viewports
- **Accessibility testing**: Screen reader, keyboard navigation
- **Performance testing**: Lighthouse scores, loading times

### Maintenance Considerations
- **Content updates**: Easy to modify links and contact info
- **Design updates**: CSS custom properties for easy theming
- **Feature additions**: Modular structure allows easy expansion
- **Analytics tracking**: Newsletter signup conversion tracking

---

## Success Metrics

### Primary KPIs
- **Newsletter conversion rate**: Target 5-10% signup rate
- **Support ticket reduction**: 15% decrease in "contact info" inquiries
- **Social media engagement**: 25% increase in footer social link clicks
- **User satisfaction**: Improved footer usability scores

### Secondary Metrics
- **Page load impact**: Minimal increase (<50ms)
- **Accessibility compliance**: WCAG 2.1 AA compliance
- **Mobile experience**: Improved mobile footer engagement
- **SEO impact**: Enhanced internal linking structure

---

This comprehensive footer design transforms the minimal existing footer into a powerful marketing and user engagement tool while maintaining the sophisticated aesthetic of the Heavenly platform.
