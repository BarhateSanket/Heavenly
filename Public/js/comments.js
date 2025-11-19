/**
 * Comments System - AJAX Management
 */

class CommentsManager {
    constructor() {
        this.listingId = this.getListingId();
        this.page = 1;
        this.hasMore = true;
        this.loading = false;
        this.init();
    }

    init() {
        if (!this.listingId) return;

        this.attachEventListeners();
        this.loadComments();
    }

    getListingId() {
        const urlParts = window.location.pathname.split('/');
        const listingIndex = urlParts.indexOf('listings');
        return listingIndex !== -1 && urlParts.length > listingIndex + 1 ? urlParts[listingIndex + 1] : null;
    }

    attachEventListeners() {
        // Comment form submission
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }

        // Load more comments
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }

        // Delegate events for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.matches('.reply-btn')) {
                this.showReplyForm(e);
            } else if (e.target.matches('.edit-btn')) {
                this.showEditForm(e);
            } else if (e.target.matches('.delete-btn')) {
                this.handleDelete(e);
            } else if (e.target.matches('.report-btn')) {
                this.handleReport(e);
            } else if (e.target.matches('.cancel-reply, .cancel-edit')) {
                this.hideForm(e);
            }
        });

        // Handle reply and edit form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.reply-form')) {
                e.preventDefault();
                this.handleReplySubmit(e);
            } else if (e.target.matches('.edit-form')) {
                e.preventDefault();
                this.handleEditSubmit(e);
            }
        });
    }

    async loadComments() {
        if (this.loading || !this.hasMore) return;

        this.loading = true;
        this.showLoading();

        try {
            const response = await fetch(`/listings/${this.listingId}/comments?page=${this.page}`);
            const data = await response.json();

            if (data.comments && data.comments.length > 0) {
                this.appendComments(data.comments);
                this.page++;
                this.hasMore = data.hasMore;
            } else {
                this.hasMore = false;
            }

            this.updateLoadMoreButton();
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Failed to load comments');
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }

    loadMoreComments() {
        this.loadComments();
    }

    async handleCommentSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const content = formData.get('comment[content]')?.trim();

        if (!content) {
            this.showError('Comment cannot be empty');
            return;
        }

        this.showFormLoading(form);

        try {
            const response = await fetch(`/listings/${this.listingId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comment: { content }
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.prependComment(data.comment);
                form.reset();
                this.showSuccess('Comment posted successfully!');
            } else {
                this.showError(data.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showError('Failed to post comment');
        } finally {
            this.hideFormLoading(form);
        }
    }

    async handleReplySubmit(e) {
        const form = e.target;
        const parentId = form.dataset.parentId;
        const formData = new FormData(form);
        const content = formData.get('content')?.trim();

        if (!content) {
            this.showError('Reply cannot be empty');
            return;
        }

        this.showFormLoading(form);

        try {
            const response = await fetch(`/listings/${this.listingId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comment: { content, parent: parentId }
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.appendReply(parentId, data.comment);
                this.hideForm(form);
                this.showSuccess('Reply posted successfully!');
            } else {
                this.showError(data.message || 'Failed to post reply');
            }
        } catch (error) {
            console.error('Error posting reply:', error);
            this.showError('Failed to post reply');
        } finally {
            this.hideFormLoading(form);
        }
    }

    async handleEditSubmit(e) {
        const form = e.target;
        const commentId = form.dataset.commentId;
        const formData = new FormData(form);
        const content = formData.get('content')?.trim();

        if (!content) {
            this.showError('Comment cannot be empty');
            return;
        }

        this.showFormLoading(form);

        try {
            const response = await fetch(`/listings/${this.listingId}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comment: { content }
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.updateComment(commentId, data.comment);
                this.hideForm(form);
                this.showSuccess('Comment updated successfully!');
            } else {
                this.showError(data.message || 'Failed to update comment');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            this.showError('Failed to update comment');
        } finally {
            this.hideFormLoading(form);
        }
    }

    async handleDelete(e) {
        e.preventDefault();

        const commentId = e.target.dataset.commentId;
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await fetch(`/listings/${this.listingId}/comments/${commentId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                this.removeComment(commentId);
                this.showSuccess('Comment deleted successfully!');
            } else {
                this.showError(data.message || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showError('Failed to delete comment');
        }
    }

    async handleReport(e) {
        e.preventDefault();

        const commentId = e.target.dataset.commentId;
        const reason = prompt('Please specify the reason for reporting this comment:');

        if (!reason || !reason.trim()) {
            this.showError('Report reason is required');
            return;
        }

        try {
            const response = await fetch(`/listings/${this.listingId}/comments/${commentId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: reason.trim() })
            });

            if (response.ok) {
                this.showSuccess('Comment reported successfully!');
            } else {
                const data = await response.json();
                this.showError(data.message || 'Failed to report comment');
            }
        } catch (error) {
            console.error('Error reporting comment:', error);
            this.showError('Failed to report comment');
        }
    }

    showReplyForm(e) {
        const commentId = e.target.dataset.commentId;
        const commentElement = e.target.closest('.comment-item');
        const existingForm = commentElement.querySelector('.reply-form');

        if (existingForm) {
            existingForm.remove();
            return;
        }

        // Remove any other reply forms
        document.querySelectorAll('.reply-form').forEach(form => form.remove());

        const replyForm = this.createReplyForm(commentId);
        commentElement.appendChild(replyForm);
        replyForm.querySelector('textarea').focus();
    }

    showEditForm(e) {
        const commentId = e.target.dataset.commentId;
        const commentElement = e.target.closest('.comment-item');
        const commentContent = commentElement.querySelector('.comment-content');
        const existingForm = commentElement.querySelector('.edit-form');

        if (existingForm) {
            existingForm.remove();
            commentContent.style.display = '';
            return;
        }

        // Remove any other edit forms
        document.querySelectorAll('.edit-form').forEach(form => form.remove());

        const editForm = this.createEditForm(commentId, commentContent.textContent.trim());
        commentContent.style.display = 'none';
        commentContent.parentNode.insertBefore(editForm, commentContent.nextSibling);
        editForm.querySelector('textarea').focus();
    }

    hideForm(e) {
        const form = e.target.closest('.reply-form, .edit-form');
        const commentElement = form.closest('.comment-item');
        const commentContent = commentElement.querySelector('.comment-content');

        if (form) {
            form.remove();
            if (commentContent) {
                commentContent.style.display = '';
            }
        }
    }

    createReplyForm(parentId) {
        const form = document.createElement('form');
        form.className = 'reply-form mt-3 p-3 bg-light rounded';
        form.dataset.parentId = parentId;
        form.innerHTML = `
            <div class="mb-2">
                <textarea class="form-control" name="content" rows="2" placeholder="Write a reply..." maxlength="1000" required></textarea>
            </div>
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm">Reply</button>
                <button type="button" class="btn btn-secondary btn-sm cancel-reply">Cancel</button>
            </div>
        `;
        return form;
    }

    createEditForm(commentId, currentContent) {
        const form = document.createElement('form');
        form.className = 'edit-form mt-2';
        form.dataset.commentId = commentId;
        form.innerHTML = `
            <div class="mb-2">
                <textarea class="form-control" name="content" rows="3" maxlength="1000" required>${currentContent}</textarea>
            </div>
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm">Update</button>
                <button type="button" class="btn btn-secondary btn-sm cancel-edit">Cancel</button>
            </div>
        `;
        return form;
    }

    appendComments(comments) {
        const container = document.getElementById('commentsList');
        if (!container) return;

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            container.appendChild(commentElement);
        });
    }

    prependComment(comment) {
        const container = document.getElementById('commentsList');
        if (!container) return;

        const commentElement = this.createCommentElement(comment);
        container.insertBefore(commentElement, container.firstChild);
    }

    appendReply(parentId, reply) {
        const parentComment = document.querySelector(`[data-comment-id="${parentId}"]`);
        if (!parentComment) return;

        let repliesContainer = parentComment.querySelector('.replies-container');
        if (!repliesContainer) {
            repliesContainer = document.createElement('div');
            repliesContainer.className = 'replies-container mt-3 ms-4';
            parentComment.appendChild(repliesContainer);
        }

        const replyElement = this.createCommentElement(reply);
        repliesContainer.appendChild(replyElement);
    }

    updateComment(commentId, updatedComment) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const contentElement = commentElement.querySelector('.comment-content');
        if (contentElement) {
            contentElement.textContent = updatedComment.content;
        }
    }

    removeComment(commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
    }

    createCommentElement(comment) {
        const element = document.createElement('div');
        element.className = 'comment-item border-bottom py-3';
        element.dataset.commentId = comment._id;

        const repliesHtml = comment.replies && comment.replies.length > 0
            ? `<div class="replies-container mt-3 ms-4">
                ${comment.replies.map(reply => this.createCommentElement(reply).outerHTML).join('')}
               </div>`
            : '';

        element.innerHTML = `
            <div class="d-flex align-items-start">
                <img src="https://via.placeholder.com/40x40?text=U" alt="User avatar" class="rounded-circle me-3" style="width: 40px; height: 40px;">
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">${comment.author ? comment.author.username : 'Anonymous'}</h6>
                            <small class="text-muted">${new Date(comment.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                    <p class="comment-content mb-2">${comment.content}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary reply-btn" data-comment-id="${comment._id}">Reply</button>
                        ${this.canEditComment(comment) ? `<button class="btn btn-sm btn-outline-primary edit-btn" data-comment-id="${comment._id}">Edit</button>` : ''}
                        ${this.canDeleteComment(comment) ? `<button class="btn btn-sm btn-outline-danger delete-btn" data-comment-id="${comment._id}">Delete</button>` : ''}
                        ${this.canReportComment(comment) ? `<button class="btn btn-sm btn-outline-warning report-btn" data-comment-id="${comment._id}">Report</button>` : ''}
                    </div>
                    ${repliesHtml}
                </div>
            </div>
        `;

        return element;
    }

    canEditComment(comment) {
        return window.currUser && comment.author && comment.author._id === window.currUser._id;
    }

    canDeleteComment(comment) {
        return window.currUser && comment.author && comment.author._id === window.currUser._id;
    }

    canReportComment(comment) {
        return window.currUser && comment.author && comment.author._id !== window.currUser._id;
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const loadMoreBtn = document.getElementById('loadMoreComments');

        if (loadMoreContainer && loadMoreBtn) {
            if (this.hasMore) {
                loadMoreContainer.style.display = '';
            } else {
                loadMoreContainer.style.display = 'none';
            }
        }
    }

    showLoading() {
        const container = document.getElementById('commentsList');
        if (container) {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'text-center py-3';
            loadingElement.id = 'commentsLoading';
            loadingElement.innerHTML = '<div class="spinner me-2"></div>Loading comments...';
            container.appendChild(loadingElement);
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('commentsLoading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showFormLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner spinner-sm me-2"></span>Posting...';
        }
    }

    hideFormLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalText || 'Post Comment';
        }
    }

    showSuccess(message) {
        if (window.toast) {
            window.toast.success(message);
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (window.toast) {
            window.toast.error(message);
        } else {
            alert('Error: ' + message);
        }
    }
}

// Initialize comments manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CommentsManager();
});