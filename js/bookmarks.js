// Load user bookmarks
async function loadBookmarks() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/bookmarks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookmarks = await response.json();
            displayBookmarks(bookmarks);
        } else {
            console.error('Failed to load bookmarks');
        }
    } catch (error) {
        console.error('Error loading bookmarks:', error);
    }
}

// Display bookmarks
function displayBookmarks(bookmarks) {
    const container = document.getElementById('bookmarks-container');
    const emptyState = document.getElementById('empty-bookmarks');
    
    if (!container) return;
    
    if (bookmarks.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    // Group by deadline urgency
    const urgent = bookmarks.filter(s => {
        const daysLeft = daysUntilDeadline(s.deadline);
        return daysLeft <= 30;
    });
    
    const upcoming = bookmarks.filter(s => {
        const daysLeft = daysUntilDeadline(s.deadline);
        return daysLeft > 30 && daysLeft <= 90;
    });
    
    const later = bookmarks.filter(s => {
        const daysLeft = daysUntilDeadline(s.deadline);
        return daysLeft > 90;
    });
    
    let html = '';
    
    if (urgent.length > 0) {
        html += '<h2 class="bookmark-section urgent">⚠️ Urgent - Apply Soon!</h2>';
        html += '<div class="scholarship-grid">';
        html += urgent.map(s => createBookmarkCard(s)).join('');
        html += '</div>';
    }
    
    if (upcoming.length > 0) {
        html += '<h2 class="bookmark-section upcoming">📅 Upcoming Deadlines</h2>';
        html += '<div class="scholarship-grid">';
        html += upcoming.map(s => createBookmarkCard(s)).join('');
        html += '</div>';
    }
    
    if (later.length > 0) {
        html += '<h2 class="bookmark-section later">📚 Plan Ahead</h2>';
        html += '<div class="scholarship-grid">';
        html += later.map(s => createBookmarkCard(s)).join('');
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Calculate days until deadline
function daysUntilDeadline(deadline) {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Create bookmark card
function createBookmarkCard(scholarship) {
    const daysLeft = daysUntilDeadline(scholarship.deadline);
    let deadlineClass = '';
    let deadlineText = '';
    
    if (daysLeft <= 7) {
        deadlineClass = 'deadline-critical';
        deadlineText = `⚠️ ${daysLeft} days left!`;
    } else if (daysLeft <= 30) {
        deadlineClass = 'deadline-warning';
        deadlineText = `⏰ ${daysLeft} days left`;
    } else {
        deadlineClass = 'deadline-normal';
        deadlineText = `📅 ${daysLeft} days left`;
    }
    
    return `
        <div class="scholarship-card bookmark-card">
            <div class="scholarship-header">
                <h3>${scholarship.title}</h3>
                <button onclick="removeBookmark(${scholarship.id})" class="remove-bookmark-btn" title="Remove bookmark">
                    ✕
                </button>
            </div>
            <p class="scholarship-provider">${scholarship.provider}</p>
            <div class="scholarship-details">
                <span class="detail-item">📚 ${scholarship.category}</span>
                <span class="detail-item">📍 ${scholarship.location}</span>
                <span class="detail-item amount">💰 $${scholarship.amount.toLocaleString()}</span>
                <span class="detail-item ${deadlineClass}">${deadlineText}</span>
            </div>
            <p class="scholarship-eligibility">${scholarship.eligibility.substring(0, 100)}...</p>
            <div class="bookmark-actions">
                <a href="#" onclick="viewScholarship(${scholarship.id})" class="view-btn">View Details</a>
                <span class="bookmark-date">
                    Saved: ${new Date(scholarship.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    `;
}

// Remove bookmark
async function removeBookmark(scholarshipId) {
    if (!confirm('Remove this scholarship from your bookmarks?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/bookmarks/${scholarshipId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Remove from local storage
            removeFromBookmarks(scholarshipId);
            // Reload bookmarks
            loadBookmarks();
            showNotification('Bookmark removed successfully!');
        }
    } catch (error) {
        console.error('Error removing bookmark:', error);
        showNotification('Failed to remove bookmark', 'error');
    }
}

// View scholarship details
async function viewScholarship(id) {
    try {
        const response = await fetch(`${API_URL}/scholarships/${id}`);
        
        if (response.ok) {
            const scholarship = await response.json();
            showScholarshipModal(scholarship);
        }
    } catch (error) {
        console.error('Error fetching scholarship:', error);
    }
}

// Show scholarship modal
function showScholarshipModal(scholarship) {
    const modal = document.getElementById('scholarship-modal');
    const content = document.getElementById('scholarship-detail-content');
    
    const daysLeft = daysUntilDeadline(scholarship.deadline);
    
    content.innerHTML = `
        <div class="scholarship-detail">
            <h2>${scholarship.title}</h2>
            <p class="provider">${scholarship.provider}</p>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="label">💰 Amount:</span>
                    <span class="value amount">$${scholarship.amount.toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <span class="label">📚 Category:</span>
                    <span class="value">${scholarship.category}</span>
                </div>
                <div class="detail-item">
                    <span class="label">📍 Location:</span>
                    <span class="value">${scholarship.location}</span>
                </div>
                <div class="detail-item">
                    <span class="label">⏰ Deadline:</span>
                    <span class="value ${daysLeft <= 30 ? 'deadline-critical' : ''}">
                        ${new Date(scholarship.deadline).toLocaleDateString()} 
                        (${daysLeft} days left)
                    </span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Eligibility Criteria</h3>
                <p>${scholarship.eligibility}</p>
            </div>
            
            <div class="detail-section">
                <h3>Description</h3>
                <p>${scholarship.description}</p>
            </div>
            
            <div class="detail-actions">
                <button onclick="removeBookmark(${scholarship.id})" class="btn-secondary">
                    Remove Bookmark
                </button>
                <a href="#" class="btn-primary">Apply Now</a>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('scholarship-modal').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize bookmarks page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('bookmarks.html')) {
        loadBookmarks();
    }
});