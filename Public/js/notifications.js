/**
 * Notifications Manager
 * Handles real-time notifications, dropdown loading, and user interactions
 */
class NotificationsManager {
    constructor() {
        this.socket = null;
        this.unreadCount = 0;
        this.notificationsDropdown = document.getElementById('notificationsDropdown');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.notificationList = document.getElementById('notificationList');
        this.noNotifications = document.getElementById('noNotifications');
        this.preferencesForm = document.getElementById('preferencesForm');
        this.markAllReadBtn = document.getElementById('markAllRead');

        this.init();
    }

    init() {
        this.connectSocket();
        this.attachEventListeners();
        this.loadInitialData();
    }

    connectSocket() {
        // Connect to Socket.io
        this.socket = io();

        // Join user's room
        this.socket.on('connect', () => {
            console.log('Connected to notifications socket');
        });

        // Listen for new notifications
        this.socket.on('notification', (notification) => {
            this.handleNewNotification(notification);
        });

        // Handle disconnection
        this.socket.on('disconnect', () => {
            console.log('Disconnected from notifications socket');
        });
    }

    attachEventListeners() {
        // Dropdown show event
        if (this.notificationsDropdown) {
            this.notificationsDropdown.addEventListener('show.bs.dropdown', () => {
                this.loadNotificationsDropdown();
            });
        }

        // Mark all as read button
        if (this.markAllReadBtn) {
            this.markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Preferences form
        if (this.preferencesForm) {
            this.preferencesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePreferences();
            });
        }

        // Mark individual notifications as read
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mark-read-btn')) {
                e.preventDefault();
                const notificationId = e.target.dataset.id;
                this.markAsRead(notificationId);
            }
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadUnreadCount(),
            this.loadPreferences()
        ]);
    }

    async loadUnreadCount() {
        try {
            const response = await fetch('/notifications/api/unread-count');
            if (response.ok) {
                const data = await response.json();
                this.updateUnreadBadge(data.unreadCount);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    }

    async loadPreferences() {
        if (!this.preferencesForm) return;

        try {
            const response = await fetch('/notifications/api/preferences');
            if (response.ok) {
                const preferences = await response.json();
                this.populatePreferencesForm(preferences);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    populatePreferencesForm(preferences) {
        const emailCheckbox = document.getElementById('emailNotifications');
        const pushCheckbox = document.getElementById('pushNotifications');
        const bookingCheckbox = document.getElementById('bookingNotifications');
        const messageCheckbox = document.getElementById('messageNotifications');
        const reviewCheckbox = document.getElementById('reviewNotifications');

        if (emailCheckbox) emailCheckbox.checked = preferences.email;
        if (pushCheckbox) pushCheckbox.checked = preferences.push;
        if (bookingCheckbox) bookingCheckbox.checked = preferences.types.booking;
        if (messageCheckbox) messageCheckbox.checked = preferences.types.message;
        if (reviewCheckbox) reviewCheckbox.checked = preferences.types.review;
    }

    async loadNotificationsDropdown() {
        if (!this.notificationList) return;

        try {
            this.notificationList.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2 text-muted small">Loading notifications...</div>
                </div>
            `;

            const response = await fetch('/notifications/api');
            if (response.ok) {
                const data = await response.json();
                this.renderNotificationsDropdown(data.notifications);
            } else {
                this.notificationList.innerHTML = `
                    <div class="text-center py-3">
                        <div class="text-muted small">Failed to load notifications</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notificationList.innerHTML = `
                <div class="text-center py-3">
                    <div class="text-muted small">Error loading notifications</div>
                </div>
            `;
        }
    }

    renderNotificationsDropdown(notifications) {
        if (!this.notificationList) return;

        if (notifications.length === 0) {
            this.notificationList.innerHTML = '';
            if (this.noNotifications) {
                this.noNotifications.classList.remove('d-none');
            }
            return;
        }

        if (this.noNotifications) {
            this.noNotifications.classList.add('d-none');
        }

        const html = notifications.slice(0, 5).map(notification => `
            <a href="/notifications" class="dropdown-item notification-item ${notification.isRead ? 'read' : 'unread'}" data-id="${notification._id}">
                <div class="d-flex align-items-start">
                    <div class="flex-grow-1">
                        <div class="notification-title ${notification.isRead ? 'text-muted' : ''} small fw-medium">
                            ${notification.title}
                        </div>
                        <div class="notification-message ${notification.isRead ? 'text-muted' : ''} small">
                            ${notification.message.length > 80 ? notification.message.substring(0, 80) + '...' : notification.message}
                        </div>
                        <small class="text-muted">
                            ${new Date(notification.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                    ${!notification.isRead ? '<div class="ms-2"><span class="badge bg-primary">New</span></div>' : ''}
                </div>
            </a>
        `).join('');

        this.notificationList.innerHTML = html;

        // Mark as read when clicked
        this.notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                this.markAsRead(id);
            });
        });
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/notifications/api/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Update UI
                const item = document.querySelector(`[data-id="${notificationId}"]`);
                if (item) {
                    item.classList.remove('unread');
                    item.classList.add('read');
                    const badge = item.querySelector('.badge');
                    if (badge) badge.remove();
                    const title = item.querySelector('.notification-title');
                    const message = item.querySelector('.notification-message');
                    if (title) title.classList.add('text-muted');
                    if (message) message.classList.add('text-muted');
                }

                // Update badge
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateUnreadBadge(this.unreadCount);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/notifications/api/read-all', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Update UI
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                    item.classList.add('read');
                    const badge = item.querySelector('.badge');
                    if (badge) badge.remove();
                    const title = item.querySelector('.notification-title');
                    const message = item.querySelector('.notification-message');
                    if (title) title.classList.add('text-muted');
                    if (message) message.classList.add('text-muted');
                });

                // Update badge
                this.unreadCount = 0;
                this.updateUnreadBadge(0);

                // Disable button
                if (this.markAllReadBtn) {
                    this.markAllReadBtn.disabled = true;
                }

                // Show success message
                if (window.toast) {
                    window.toast.success('All notifications marked as read');
                }
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            if (window.toast) {
                window.toast.error('Failed to mark notifications as read');
            }
        }
    }

    async updatePreferences() {
        const formData = new FormData(this.preferencesForm);
        const preferences = {
            email: formData.has('email'),
            push: formData.has('push'),
            types: {
                booking: formData.has('types[booking]'),
                message: formData.has('types[message]'),
                review: formData.has('types[review]')
            }
        };

        try {
            const response = await fetch('/notifications/api/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences)
            });

            if (response.ok) {
                if (window.toast) {
                    window.toast.success('Preferences updated successfully');
                }
            } else {
                throw new Error('Failed to update preferences');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            if (window.toast) {
                window.toast.error('Failed to update preferences');
            }
        }
    }

    handleNewNotification(notification) {
        // Update unread count
        this.unreadCount++;
        this.updateUnreadBadge(this.unreadCount);

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png'
            });
        }

        // Add to dropdown if open
        if (this.notificationsDropdown && this.notificationsDropdown.classList.contains('show')) {
            this.loadNotificationsDropdown();
        }

        // Show toast notification
        if (window.toast) {
            window.toast.info(notification.title, 5000);
        }
    }

    updateUnreadBadge(count) {
        this.unreadCount = count;
        if (this.notificationBadge) {
            if (count > 0) {
                this.notificationBadge.textContent = count > 99 ? '99+' : count;
                this.notificationBadge.classList.remove('d-none');
            } else {
                this.notificationBadge.classList.add('d-none');
            }
        }

        // Update mark all read button
        if (this.markAllReadBtn) {
            this.markAllReadBtn.disabled = count === 0;
        }
    }

    destroy() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Initialize notifications manager
document.addEventListener('DOMContentLoaded', () => {
    window.notificationsManager = new NotificationsManager();
});