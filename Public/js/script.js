/**
 * Heavenly Airbnb Clone - Enhanced JavaScript
 */

// Form Validation Handler
(() => {
    'use strict'

    // Select all forms that need Bootstrap validation
    const forms = document.querySelectorAll('.needs-validation')

    // Process each form in the collection
    Array.from(forms).forEach(form => {
      // Add submit event listener to each form
      form.addEventListener('submit', event => {
        // Check if the form is valid
        if (!form.checkValidity()) {
          // Prevent form submission if validation fails
          event.preventDefault()
          event.stopPropagation()
        }

        // Add validation feedback styles
        form.classList.add('was-validated')
      }, false)
    })
})()

// Infinite Scroll for Listings
class InfiniteScroll {
    constructor() {
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
        this.listingsContainer = document.querySelector('.row.row-cols-1');
        this.loadingIndicator = null;

        if (this.listingsContainer) {
            this.init();
        }
    }

    init() {
        this.createLoadingIndicator();
        this.attachScrollListener();
    }

    createLoadingIndicator() {
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'text-center py-4 d-none';
        this.loadingIndicator.innerHTML = `
            <div class="spinner mb-2"></div>
            <p class="text-muted small">Loading more listings...</p>
        `;
        this.listingsContainer.parentNode.appendChild(this.loadingIndicator);
    }

    attachScrollListener() {
        window.addEventListener('scroll', () => {
            if (this.shouldLoadMore() && !this.loading && this.hasMore) {
                this.loadMoreListings();
            }
        });
    }

    shouldLoadMore() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is 200px from bottom
        return (scrollTop + windowHeight) >= (documentHeight - 200);
    }

    async loadMoreListings() {
        this.loading = true;
        this.loadingIndicator.classList.remove('d-none');

        try {
            const url = new URL(window.location);
            url.searchParams.set('page', this.page + 1);
            url.searchParams.set('ajax', 'true');

            const response = await fetch(url);
            const data = await response.json();

            if (data.listings && data.listings.length > 0) {
                this.appendListings(data.listings);
                this.page++;
            } else {
                this.hasMore = false;
            }
        } catch (error) {
            console.error('Error loading more listings:', error);
            this.hasMore = false;
        } finally {
            this.loading = false;
            this.loadingIndicator.classList.add('d-none');
        }
    }

    appendListings(listings) {
        listings.forEach(listing => {
            const listingHTML = this.createListingHTML(listing);
            this.listingsContainer.insertAdjacentHTML('beforeend', listingHTML);
        });
    }

    createListingHTML(listing) {
        return `
            <div class="col">
                <a href="/listings/${listing._id}" class="listing-link">
                    <div class="card listing-card h-100">
                        <div class="position-relative">
                            <img src="${listing.image}" class="card-img-top" alt="${listing.title} - ${listing.location}, ${listing.country}" style="height: 250px;">
                            <div class="card-img-overlay d-flex align-items-end">
                                <div class="w-100 p-3">
                                    <div class="d-flex justify-content-between align-items-end">
                                        <div>
                                            <h5 class="text-white mb-1 fw-bold">${listing.title}</h5>
                                            <p class="text-white-50 mb-0 small">${listing.location}</p>
                                        </div>
                                        <div class="text-end">
                                            <div class="bg-white bg-opacity-90 rounded-pill px-3 py-1">
                                                <span class="fw-bold text-dark">₹${listing.price.toLocaleString("en-IN")}</span>
                                                <small class="text-muted">/night</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="flex-grow-1">
                                    <h6 class="card-title mb-1">${listing.title}</h6>
                                    <p class="card-text text-muted small mb-0">${listing.location}, ${listing.country}</p>
                                </div>
                            </div>
                            <div class="mt-auto">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-star text-warning me-1"></i>
                                        <span class="small fw-medium">4.8</span>
                                        <span class="text-muted small ms-1">(120)</span>
                                    </div>
                                    <small class="text-muted">2-4 guests</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }
}

// Toast Notifications
class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        return new Promise((resolve) => {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type} fade-in`;

            const iconMap = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };

            toast.innerHTML = `
                <div class="d-flex align-items-start">
                    <i class="fas fa-${iconMap[type]} toast-icon me-3 mt-1"></i>
                    <div class="toast-content flex-grow-1">
                        <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div class="toast-message">${message}</div>
                    </div>
                    <button class="toast-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            this.container.appendChild(toast);

            // Add close event listener
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                });
            }

            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);

            // Auto remove
            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }

            // Resolve the promise with the toast element
            resolve(toast);
        });
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Search Autocomplete
class SearchAutocomplete {
    constructor(inputSelector, resultsSelector) {
        this.input = document.querySelector(inputSelector);
        this.results = document.querySelector(resultsSelector);
        this.debounceTimer = null;
        this.selectedIndex = -1;

        if (this.input && this.results) {
            this.init();
        }
    }

    init() {
        this.input.addEventListener('input', (e) => this.onInput(e));
        this.input.addEventListener('keydown', (e) => this.onKeydown(e));
        this.input.addEventListener('blur', () => this.hideResults());
        this.input.addEventListener('focus', () => {
            if (this.input.value.length >= 2) {
                this.search(this.input.value);
            }
        });
    }

    onInput(e) {
        const query = e.target.value.trim();

        clearTimeout(this.debounceTimer);
        this.selectedIndex = -1;

        if (query.length < 2) {
            this.hideResults();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.search(query);
        }, 300);
    }

    onKeydown(e) {
        if (!this.results.classList.contains('show')) return;

        const items = this.results.querySelectorAll('.autocomplete-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    this.selectItem(items[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hideResults();
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.selectedIndex);
        });
    }

    async search(query) {
        try {
            const response = await fetch(`/listings/api/search-suggestions?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            this.showResults(data.suggestions, query);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showResults(suggestions, query) {
        if (suggestions.length === 0) {
            this.hideResults();
            return;
        }

        this.results.innerHTML = suggestions.map(suggestion => `
            <div class="autocomplete-item" data-value="${suggestion}">
                <i class="fas fa-search"></i>
                ${this.highlightMatch(suggestion, query)}
            </div>
        `).join('');

        this.results.classList.add('show');

        // Add click handlers
        this.results.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => this.selectItem(item));
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = Array.from(this.results.children).indexOf(item);
                this.updateSelection(this.results.children);
            });
        });
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    selectItem(item) {
        const value = item.dataset.value;
        this.input.value = value;
        this.hideResults();
        this.input.focus();
    }

    hideResults() {
        this.results.classList.remove('show');
        this.selectedIndex = -1;
    }
}

// Sorting functionality
class ListingSorter {
    constructor() {
        this.sortSelect = document.querySelector('#sort-select');
        this.currentUrl = new URL(window.location);

        if (this.sortSelect) {
            this.init();
        }
    }

    init() {
        this.sortSelect.addEventListener('change', (e) => this.handleSortChange(e));
    }

    handleSortChange(e) {
        const sortValue = e.target.value;
        this.currentUrl.searchParams.set('sort', sortValue);
        this.currentUrl.searchParams.set('page', '1'); // Reset to first page

        // Reload the page with new sort parameter
        window.location.href = this.currentUrl.toString();
    }
}

// Filter functionality
class ListingFilters {
    constructor() {
        this.filterForm = document.querySelector('#filter-form');
        this.clearButtons = document.querySelectorAll('.filter-sidebar input[type="checkbox"], .filter-sidebar input[type="radio"]');

        if (this.filterForm) {
            this.init();
        }
    }

    init() {
        // Handle filter form submission
        this.filterForm.addEventListener('submit', (e) => this.handleFilterSubmit(e));

        // Handle clear all link
        const clearAllLink = document.querySelector('.filter-sidebar .text-decoration-none');
        if (clearAllLink) {
            clearAllLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearAllFilters();
            });
        }
    }

    handleFilterSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.filterForm);
        const params = new URLSearchParams(window.location.search);

        // Clear existing filter params
        ['type', 'amenity', 'rating'].forEach(param => {
            params.delete(param);
        });

        // Add new filter params
        for (let [key, value] of formData.entries()) {
            if (value) {
                params.append(key, value);
            }
        }

        params.set('page', '1'); // Reset to first page

        // Redirect with filters
        window.location.search = params.toString();
    }

    clearAllFilters() {
        const url = new URL(window.location);
        const paramsToKeep = ['search', 'minPrice', 'maxPrice'];

        // Remove all params except the ones to keep
        for (let param of url.searchParams.keys()) {
            if (!paramsToKeep.includes(param)) {
                url.searchParams.delete(param);
            }
        }

        url.searchParams.set('page', '1');
        window.location.href = url.toString();
    }
}

// Mobile Filters
class MobileFilters {
    constructor() {
        this.offcanvas = document.querySelector('#mobileFilters');
        this.content = document.querySelector('#mobile-filter-content');
        this.desktopFilters = document.querySelector('.filter-sidebar .card-body');

        if (this.offcanvas && this.content && this.desktopFilters) {
            this.init();
        }
    }

    init() {
        // Clone desktop filters to mobile offcanvas
        this.content.innerHTML = this.desktopFilters.innerHTML;

        // Add event listeners to mobile filter elements
        this.setupMobileFilterListeners();
    }

    setupMobileFilterListeners() {
        // Handle mobile filter form submission
        const mobileFilterForm = this.content.querySelector('form');
        if (mobileFilterForm) {
            mobileFilterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Close offcanvas
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(this.offcanvas);
                if (bsOffcanvas) {
                    bsOffcanvas.hide();
                }
                // Submit the form
                mobileFilterForm.submit();
            });
        }

        // Handle clear all link in mobile
        const clearLink = this.content.querySelector('.text-decoration-none');
        if (clearLink) {
            clearLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(this.offcanvas);
                if (bsOffcanvas) {
                    bsOffcanvas.hide();
                }
                window.location.href = clearLink.href;
            });
        }
    }
}

// Pull to Refresh
class PullToRefresh {
    constructor() {
        this.pullThreshold = 80;
        this.isPulling = false;
        this.startY = 0;
        this.currentY = 0;
        this.pullIndicator = null;

        if ('serviceWorker' in navigator && 'ontouchstart' in window) {
            this.init();
        }
    }

    init() {
        this.createPullIndicator();
        this.attachTouchListeners();
    }

    createPullIndicator() {
        this.pullIndicator = document.createElement('div');
        this.pullIndicator.className = 'pull-refresh-indicator';
        this.pullIndicator.innerHTML = `
            <div class="d-flex align-items-center justify-content-center p-3">
                <div class="spinner spinner-sm me-2"></div>
                <span>Refreshing...</span>
            </div>
        `;
        this.pullIndicator.style.cssText = `
            position: fixed;
            top: -60px;
            left: 0;
            right: 0;
            background: var(--color-bg-primary);
            border-bottom: 1px solid var(--color-border-light);
            z-index: 1000;
            transition: transform 0.3s ease;
            transform: translateY(-100%);
        `;
        document.body.appendChild(this.pullIndicator);
    }

    attachTouchListeners() {
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                this.startY = e.touches[0].clientY;
                this.isPulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.isPulling) return;

            this.currentY = e.touches[0].clientY;
            const pullDistance = this.currentY - this.startY;

            if (pullDistance > 0 && pullDistance < this.pullThreshold) {
                e.preventDefault();
                this.updatePullIndicator(pullDistance);
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (!this.isPulling) return;

            const pullDistance = this.currentY - this.startY;

            if (pullDistance >= this.pullThreshold) {
                this.refreshPage();
            } else {
                this.resetPullIndicator();
            }

            this.isPulling = false;
        });
    }

    updatePullIndicator(distance) {
        const progress = Math.min(distance / this.pullThreshold, 1);
        this.pullIndicator.style.transform = `translateY(${distance - 60}px)`;
        this.pullIndicator.style.opacity = progress;
    }

    resetPullIndicator() {
        this.pullIndicator.style.transform = 'translateY(-100%)';
        this.pullIndicator.style.opacity = '0';
    }

    refreshPage() {
        this.pullIndicator.querySelector('span').textContent = 'Refreshing...';
        this.pullIndicator.style.transform = 'translateY(0)';

        // Small delay for visual feedback
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// Keyboard Navigation
class KeyboardNavigation {
    constructor() {
        this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.setupRovingTabIndex();
    }

    handleKeydown(e) {
        // ESC key handling
        if (e.key === 'Escape') {
            this.handleEscape(e);
        }

        // Tab navigation improvements
        if (e.key === 'Tab') {
            this.handleTabNavigation(e);
        }
    }

    handleEscape(e) {
        // Close modals, dropdowns, offcanvas, etc.
        const openModal = document.querySelector('.modal.show');
        const openOffcanvas = document.querySelector('.offcanvas.show');
        const openDropdown = document.querySelector('.dropdown-menu.show');

        if (openModal) {
            const bsModal = bootstrap.Modal.getInstance(openModal);
            if (bsModal) bsModal.hide();
            e.preventDefault();
        }

        if (openOffcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(openOffcanvas);
            if (bsOffcanvas) bsOffcanvas.hide();
            e.preventDefault();
        }

        if (openDropdown) {
            const dropdownToggle = document.querySelector('[aria-expanded="true"]');
            if (dropdownToggle) dropdownToggle.click();
            e.preventDefault();
        }
    }

    handleTabNavigation(e) {
        // Ensure focus management for dynamic content
        setTimeout(() => {
            const focusedElement = document.activeElement;
            if (focusedElement) {
                focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 0);
    }

    setupRovingTabIndex() {
        // Handle roving tabindex for custom components like autocomplete
        document.addEventListener('focusin', (e) => {
            // Remove tabindex from siblings when entering a component
            const component = e.target.closest('[data-roving-tabindex]');
            if (component) {
                const focusableItems = component.querySelectorAll(this.focusableElements);
                focusableItems.forEach(item => {
                    if (item !== e.target) {
                        item.setAttribute('tabindex', '-1');
                    }
                });
                e.target.setAttribute('tabindex', '0');
            }
        });
    }
}

// Screen Reader Support
class ScreenReaderSupport {
    constructor() {
        this.init();
    }

    init() {
        this.addLiveRegions();
        this.setupAriaLiveUpdates();
    }

    addLiveRegions() {
        // Add live region for dynamic content updates
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);

        this.liveRegion = liveRegion;
    }

    setupAriaLiveUpdates() {
        // Announce search results
        const searchInput = document.querySelector('#search-input');
        if (searchInput) {
            let previousValue = '';
            searchInput.addEventListener('input', () => {
                const currentValue = searchInput.value;
                if (currentValue !== previousValue) {
                    if (currentValue.length > 2) {
                        this.announce('Searching for: ' + currentValue);
                    }
                    previousValue = currentValue;
                }
            });
        }

        // Announce filter changes
        const filterForm = document.querySelector('#filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', () => {
                this.announce('Applying filters');
            });
        }
    }

    announce(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Color Contrast Checker (Development helper)
class ColorContrastChecker {
    constructor() {
        this.init();
    }

    init() {
        // Only run in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.checkContrast();
        }
    }

    checkContrast() {
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const backgroundColor = styles.backgroundColor;
            const color = styles.color;

            if (backgroundColor && color && backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)') {
                const contrast = this.calculateContrast(this.parseColor(backgroundColor), this.parseColor(color));
                if (contrast < 4.5) {
                    console.warn('Low contrast detected:', element, 'Contrast ratio:', contrast);
                    element.style.outline = '2px solid red';
                }
            }
        });
    }

    parseColor(color) {
        if (color.startsWith('rgb')) {
            const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            return matches ? [parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3])] : [0, 0, 0];
        }
        return [0, 0, 0];
    }

    calculateContrast(color1, color2) {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    getLuminance(rgb) {
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
}

// Lazy Loading Images
class LazyImageLoader {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.observer = null;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px 0px',
            threshold: 0.01
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        this.images.forEach(img => this.observer.observe(img));
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');

        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }

        if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
        }

        img.classList.add('loaded');
    }

    loadAllImages() {
        this.images.forEach(img => this.loadImage(img));
    }
}

// Image Optimization & WebP Support
class ImageOptimizer {
    constructor() {
        this.webpSupported = null;
        this.init();
    }

    async init() {
        this.webpSupported = await this.checkWebPSupport();
        this.optimizeExistingImages();
    }

    async checkWebPSupport() {
        return new Promise(resolve => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    optimizeExistingImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            this.optimizeImage(img);
        });
    }

    optimizeImage(img) {
        // Add loading="lazy" if not present
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }

        // Add decoding="async" for better performance
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }

        // Add fetchpriority for above-the-fold images
        if (!img.hasAttribute('fetchpriority') && this.isAboveFold(img)) {
            img.setAttribute('fetchpriority', 'high');
        }
    }

    isAboveFold(img) {
        const rect = img.getBoundingClientRect();
        return rect.top < window.innerHeight;
    }
}

// Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        this.measureCoreWebVitals();
        this.monitorResourceLoading();
    }

    measureCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay (FID)
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift (CLS)
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    console.log('CLS:', clsValue);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('Performance monitoring not fully supported');
            }
        }
    }

    monitorResourceLoading() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = performance.getEntriesByType('resource');
                const slowResources = resources.filter(resource =>
                    resource.duration > 1000
                );

                if (slowResources.length > 0) {
                    console.warn('Slow loading resources:', slowResources);
                }
            }, 0);
        });
    }
}

// Critical CSS Inliner (for above-the-fold content)
class CriticalCSSInliner {
    constructor() {
        this.init();
    }

    init() {
        // Mark critical CSS
        this.markCriticalElements();

        // Defer non-critical CSS
        this.deferNonCriticalCSS();
    }

    markCriticalElements() {
        // Mark elements that are likely above the fold
        const criticalSelectors = [
            'nav.navbar',
            '.search-form',
            '.listing-card:nth-child(-n+6)', // First 6 listings
            '.filter-sidebar'
        ];

        criticalSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.setAttribute('data-critical', 'true'));
        });
    }

    deferNonCriticalCSS() {
        // Move non-critical stylesheets to load after initial render
        const links = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
        links.forEach(link => {
            link.setAttribute('media', 'print');
            link.setAttribute('onload', "this.media='all'");
        });
    }
}

// Service Worker Registration
class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('Service Worker registered successfully');

                // Handle updates
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });

                // Check for updates periodically
                setInterval(() => {
                    this.registration.update();
                }, 60 * 60 * 1000); // Check every hour

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    showUpdateNotification() {
        if (window.toast) {
            window.toast.info('A new version is available!', 0).then(toast => {
                // Add update button
                const updateBtn = document.createElement('button');
                updateBtn.className = 'btn btn-primary btn-sm ms-2';
                updateBtn.textContent = 'Update';
                updateBtn.onclick = () => this.updateApp();

                toast.appendChild(updateBtn);
            });
        }
    }

    updateApp() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
}

// PWA Install Prompt
class PWAInstallPrompt {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.deferredPrompt = null;
        });
    }

    showInstallPrompt() {
        setTimeout(() => {
            if (window.toast && this.deferredPrompt) {
                window.toast.info('Install Heavenly for a better experience!', 10000).then(toast => {
                    const installBtn = document.createElement('button');
                    installBtn.className = 'btn btn-primary btn-sm ms-2';
                    installBtn.textContent = 'Install';
                    installBtn.onclick = () => this.installApp();

                    toast.appendChild(installBtn);
                });
            }
        }, 3000); // Show after 3 seconds
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log(`User response to install prompt: ${outcome}`);
        this.deferredPrompt = null;
    }
}

// Confirmation Dialog
class ConfirmationDialog {
    constructor() {
        this.dialog = null;
        this.init();
    }

    init() {
        // Create dialog element
        this.createDialog();
        document.body.appendChild(this.dialog);
    }

    createDialog() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'modal-backdrop';
        this.dialog.innerHTML = `
            <div class="confirmation-dialog modal">
                <div class="confirmation-header">
                    <h5 class="modal-title">Confirm Action</h5>
                </div>
                <div class="confirmation-body">
                    <p class="confirmation-message">Are you sure you want to proceed?</p>
                    <div class="confirmation-actions">
                        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                        <button class="btn btn-danger" data-action="confirm">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog || e.target.dataset.action === 'cancel') {
                this.hide();
            } else if (e.target.dataset.action === 'confirm') {
                this.confirm();
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.dialog.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.hide();
                } else if (e.key === 'Enter') {
                    this.confirm();
                }
            }
        });
    }

    show(message = 'Are you sure you want to proceed?', onConfirm = null) {
        this.onConfirm = onConfirm;
        this.dialog.querySelector('.confirmation-message').textContent = message;
        this.dialog.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus management
        const confirmBtn = this.dialog.querySelector('[data-action="confirm"]');
        if (confirmBtn) confirmBtn.focus();
    }

    hide() {
        this.dialog.classList.remove('active');
        document.body.style.overflow = '';
        this.onConfirm = null;
    }

    confirm() {
        if (this.onConfirm) {
            this.onConfirm();
        }
        this.hide();
    }
}

// Progress Indicator
class ProgressIndicator {
    constructor() {
        this.container = null;
        this.bar = null;
        this.label = null;
    }

    create(options = {}) {
        this.container = document.createElement('div');
        this.container.className = 'progress-container';
        this.container.innerHTML = `
            <div class="progress-bar" style="width: 0%"></div>
        `;

        if (options.label) {
            this.label = document.createElement('div');
            this.label.className = 'progress-label mt-2 text-center small text-muted';
            this.label.textContent = options.label;
            this.container.appendChild(this.label);
        }

        this.bar = this.container.querySelector('.progress-bar');
        return this.container;
    }

    update(progress, label = null) {
        if (this.bar) {
            this.bar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
        }
        if (this.label && label) {
            this.label.textContent = label;
        }
    }

    complete() {
        this.update(100, 'Complete!');
        setTimeout(() => {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }, 1000);
    }

    error(message = 'Error occurred') {
        if (this.bar) {
            this.bar.style.background = 'linear-gradient(90deg, var(--color-error), #dc2626)';
        }
        if (this.label) {
            this.label.textContent = message;
            this.label.style.color = 'var(--color-error)';
        }
    }
}

// Enhanced Form Handling
class FormHandler {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

        if (submitBtn && !form.hasAttribute('data-no-loading')) {
            this.showLoadingState(submitBtn);
        }

        // Handle delete forms with confirmation
        if (form.action.includes('/delete') || form.action.includes('?_method=DELETE')) {
            e.preventDefault();
            this.handleDeleteConfirmation(form);
            return;
        }
    }

    showLoadingState(button) {
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner spinner-sm me-2"></span>Processing...';
        button.dataset.originalText = originalText;

        // Auto-restore after 10 seconds (fallback)
        setTimeout(() => {
            this.restoreButton(button);
        }, 10000);
    }

    restoreButton(button) {
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            button.disabled = false;
            delete button.dataset.originalText;
        }
    }

    handleDeleteConfirmation(form) {
        const itemName = form.dataset.itemName || 'this item';

        if (window.confirmationDialog) {
            window.confirmationDialog.show(
                `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
                () => {
                    form.submit();
                }
            );
        } else {
            // Fallback to browser confirm
            if (confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
                form.submit();
            }
        }
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.attachToggleListener();
        this.updateToggleButton();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    storeTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.storeTheme(theme);
        this.updateToggleButton();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    updateToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const ariaLabel = this.currentTheme === 'light'
                ? 'Switch to dark mode'
                : 'Switch to light mode';
            toggleBtn.setAttribute('aria-label', ariaLabel);
            toggleBtn.setAttribute('title', ariaLabel);
        }
    }

    attachToggleListener() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    }
}

// Map Manager for Listings
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.listingsData = window.listingsData || [];
        this.mapElement = document.getElementById('map');

        if (this.mapElement && this.listingsData.length > 0) {
            this.init();
        }
    }

    init() {
        // Initialize map centered on India
        this.map = L.map('map').setView([20.5937, 78.9629], 5);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // Add markers for listings
        this.addMarkers();

        // Fit map to show all markers
        this.fitBounds();
    }

    addMarkers() {
        this.listingsData.forEach(listing => {
            if (listing.geometry && listing.geometry.coordinates) {
                const [lng, lat] = listing.geometry.coordinates;

                // Create custom icon based on listing type
                const iconHtml = this.getMarkerIcon(listing);
                const customIcon = L.divIcon({
                    html: iconHtml,
                    className: 'custom-marker',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                });

                // Create marker
                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

                // Create popup content
                const popupContent = this.createPopupContent(listing);
                marker.bindPopup(popupContent);

                // Add click handler to navigate to listing
                marker.on('click', () => {
                    window.location.href = `/listings/${listing._id}`;
                });

                this.markers.push(marker);
            }
        });
    }

    getMarkerIcon(listing) {
        let iconClass = 'fas fa-home';
        let color = '#fe424d'; // Default color

        if (listing.premiumTier) {
            iconClass = 'fas fa-crown';
            color = '#ffd700'; // Gold for premium
        } else if (listing.isFeatured) {
            iconClass = 'fas fa-star';
            color = '#ff6b35'; // Orange for featured
        }

        return `
            <div style="
                background: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 3px solid ${color};
            ">
                <i class="${iconClass}" style="color: ${color}; font-size: 16px;"></i>
            </div>
        `;
    }

    createPopupContent(listing) {
        return `
            <div class="map-popup" style="min-width: 200px;">
                <img src="${listing.image}" alt="${listing.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
                <h6 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${listing.title}</h6>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${listing.location}, ${listing.country}</p>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #fe424d;">₹${listing.price.toLocaleString('en-IN')}/night</p>
                ${listing.premiumTier ? `<div style="font-size: 11px; color: #ffd700; margin-top: 4px;"><i class="fas fa-crown"></i> Premium</div>` : ''}
                ${listing.isFeatured ? `<div style="font-size: 11px; color: #ff6b35; margin-top: 4px;"><i class="fas fa-star"></i> Featured</div>` : ''}
            </div>
        `;
    }

    fitBounds() {
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    new ThemeManager();

    // Initialize infinite scroll
    new InfiniteScroll();

    // Initialize search autocomplete
    new SearchAutocomplete('#search-input', '#autocomplete-results');

    // Initialize sorting
    new ListingSorter();

    // Initialize filters
    new ListingFilters();

    // Initialize mobile filters
    new MobileFilters();

    // Initialize pull to refresh
    new PullToRefresh();

    // Initialize keyboard navigation
    new KeyboardNavigation();

    // Initialize screen reader support
    new ScreenReaderSupport();

    // Initialize color contrast checker
    // new ColorContrastChecker();

    // Initialize lazy loading
    new LazyImageLoader();

    // Initialize image optimization
    new ImageOptimizer();

    // Initialize performance monitoring
    new PerformanceMonitor();

    // Initialize critical CSS inliner
    new CriticalCSSInliner();

    // Initialize service worker
    new ServiceWorkerManager();

    // Initialize PWA install prompt
    new PWAInstallPrompt();

    // Initialize confirmation dialog
    window.confirmationDialog = new ConfirmationDialog();

    // Initialize form handler
    new FormHandler();

    // Initialize toast manager
    window.toast = new ToastManager();

    // Add progress indicator to window for global access
    window.ProgressIndicator = ProgressIndicator;

    // Initialize messaging features
    new MessagingManager();

    // Initialize map manager
    new MapManager();
});

// Messaging Manager for unread count updates
class MessagingManager {
    constructor() {
        this.unreadBadge = document.getElementById('unreadBadge');
        this.updateInterval = null;
        this.init();
    }

    init() {
        if (this.unreadBadge) {
            this.updateUnreadCount();
            // Update every 30 seconds
            this.updateInterval = setInterval(() => {
                this.updateUnreadCount();
            }, 30000);
        }
    }

    async updateUnreadCount() {
        try {
            const response = await fetch('/messages/api/unread-count');
            if (response.ok) {
                const data = await response.json();
                this.displayUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }

    displayUnreadCount(count) {
        if (!this.unreadBadge) return;

        if (count > 0) {
            this.unreadBadge.textContent = count > 99 ? '99+' : count;
            this.unreadBadge.classList.remove('d-none');
        } else {
            this.unreadBadge.classList.add('d-none');
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}