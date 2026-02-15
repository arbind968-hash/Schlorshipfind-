// API Base URL
const API_URL = 'http://localhost:5000/api';

// Global variables
let currentScholarships = [];
let currentPage = 1;
const itemsPerPage = 9;

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (token && user) {
        updateUIForLoggedInUser(user);
    }
}

// Update UI based on auth state
function updateUIForLoggedInUser(user) {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const bookmarksLink = document.getElementById('bookmarks-link');
    const adminLink = document.getElementById('admin-link');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (bookmarksLink) bookmarksLink.style.display = 'block';
    
    if (user.role === 'admin' && adminLink) {
        adminLink.style.display = 'block';
        adminLink.innerHTML = '<a href="admin-dashboard.html">Admin Dashboard</a>';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('bookmarks');
    window.location.href = 'index.html';
}

// Load scholarships with filters
async function loadScholarships(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_URL}/scholarships${queryParams ? '?' + queryParams : ''}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
            currentScholarships = await response.json();
            displayScholarships();
            updateResultsCount();
        }
    } catch (error) {
        console.error('Error loading scholarships:', error);
        showNotification('Failed to load scholarships', 'error');
    }
}

// Display scholarships with pagination
function displayScholarships() {
    const grid = document.getElementById('scholarship-grid');
    if (!grid) return;
    
    if (currentScholarships.length === 0) {
        grid.innerHTML = '<div class="no-results">No scholarships found matching your criteria.</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // Apply sorting
    sortCurrentScholarships();
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedScholarships = currentScholarships.slice(startIndex, endIndex);
    
    // Display scholarships
    grid.innerHTML = paginatedScholarships.map(scholarship => `
        <div class="scholarship-card">
            <div class="scholarship-header">
                <h3>${scholarship.title}</h3>
                <button onclick="toggleBookmark(${scholarship.id})" class="bookmark-btn ${isBookmarked(scholarship.id) ? 'active' : ''}">
                    ${isBookmarked(scholarship.id) ? '★' : '☆'}
                </button>
            </div>
            <p class="scholarship-provider">${scholarship.provider}</p>
            <div class="scholarship-details">
                <span class="detail-item">📚 ${scholarship.category}</span>
                <span class="detail-item">📍 ${scholarship.location}</span>
                <span class="detail-item amount">💰 $${Number(scholarship.amount).toLocaleString()}</span>
                <span class="detail-item deadline ${getDeadlineClass(scholarship.deadline)}">
                    ⏰ ${formatDeadline(scholarship.deadline)}
                </span>
            </div>
            <p class="scholarship-eligibility">${truncateText(scholarship.eligibility, 100)}</p>
            <a href="#" onclick="viewScholarship(${scholarship.id}); return false;" class="view-btn">View Details</a>
        </div>
    `).join('');
    
    // Update pagination
    updatePagination();
}

// Get deadline class
function getDeadlineClass(deadline) {
    const daysLeft = daysUntilDeadline(deadline);
    if (daysLeft <= 7) return 'deadline-critical';
    if (daysLeft <= 30) return 'deadline-warning';
    return 'deadline-normal';
}

// Format deadline
function formatDeadline(deadline) {
    const daysLeft = daysUntilDeadline(deadline);
    return `${new Date(deadline).toLocaleDateString()} (${daysLeft} days)`;
}

// Days until deadline
function daysUntilDeadline(deadline) {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Truncate text
function truncateText(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Sort scholarships
function sortCurrentScholarships() {
    const sortBy = document.getElementById('sort-select')?.value || 'newest';
    
    switch(sortBy) {
        case 'amount-high':
            currentScholarships.sort((a, b) => Number(b.amount) - Number(a.amount));
            break;
        case 'amount-low':
            currentScholarships.sort((a, b) => Number(a.amount) - Number(b.amount));
            break;
        case 'deadline':
            currentScholarships.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            break;
        case 'newest':
        default:
            currentScholarships.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
            break;
    }
}

// Update results count
function updateResultsCount() {
    const countEl = document.getElementById('results-count');
    if (countEl) {
        countEl.textContent = `Showing ${currentScholarships.length} scholarships`;
    }
}

// Update pagination
function updatePagination() {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    
    const totalPages = Math.ceil(currentScholarships.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    
    paginationEl.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayScholarships();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Apply filters
function applyFilters() {
    currentPage = 1;
    
    const filters = {
        category: document.getElementById('filter-category')?.value,
        minAmount: document.getElementById('filter-min-amount')?.value,
        maxAmount: document.getElementById('filter-max-amount')?.value,
        location: document.getElementById('filter-location')?.value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    loadScholarships(filters);
}

// Reset filters
function resetFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-min-amount').value = '';
    document.getElementById('filter-max-amount').value = '';
    document.getElementById('filter-location').value = '';
    document.getElementById('sort-select').value = 'newest';
    
    currentPage = 1;
    loadScholarships();
}

// Sort scholarships
function sortScholarships() {
    currentPage = 1;
    displayScholarships();
}

// Search scholarships
function searchScholarships() {
    const searchTerm = document.getElementById('search-input')?.value;
    if (searchTerm && searchTerm.trim()) {
        currentPage = 1;
        loadScholarships({ search: searchTerm });
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
        showNotification('Failed to load scholarship details', 'error');
    }
}

// Show scholarship modal
function showScholarshipModal(scholarship) {
    const modal = document.getElementById('scholarship-modal');
    const content = document.getElementById('scholarship-detail-content');
    
    const daysLeft = daysUntilDeadline(scholarship.deadline);
    const bookmarked = isBookmarked(scholarship.id);
    
    content.innerHTML = `
        <div class="scholarship-detail">
            <h2>${scholarship.title}</h2>
            <p class="provider">${scholarship.provider}</p>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="label">💰 Amount:</span>
                    <span class="value amount">$${Number(scholarship.amount).toLocaleString()}</span>
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
                <p>${scholarship.eligibility || 'No specific eligibility criteria provided.'}</p>
            </div>
            
            <div class="detail-section">
                <h3>Description</h3>
                <p>${scholarship.description || 'No description provided.'}</p>
            </div>
            
            <div class="detail-actions">
                <button onclick="toggleBookmark(${scholarship.id})" class="btn-secondary">
                    ${bookmarked ? '★ Remove Bookmark' : '☆ Add to Bookmarks'}
                </button>
                <a href="#" onclick="applyToScholarship(${scholarship.id}); return false;" class="btn-primary">Apply Now</a>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Apply to scholarship
function applyToScholarship(id) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNotification('Please login to apply', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    showNotification('Application started! Check your email for details.', 'success');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('scholarship-modal');
    if (modal) modal.style.display = 'none';
}

// ============= BOOKMARK FUNCTIONS =============

// Check if scholarship is bookmarked
function isBookmarked(scholarshipId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return bookmarks.includes(Number(scholarshipId));
}

// Toggle bookmark
async function toggleBookmark(scholarshipId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNotification('Please login to bookmark scholarships', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const bookmarked = isBookmarked(scholarshipId);
    
    if (bookmarked) {
        // Remove bookmark
        try {
            const response = await fetch(`${API_URL}/bookmarks/${scholarshipId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                removeFromBookmarks(scholarshipId);
                showNotification('Bookmark removed');
                refreshBookmarkButtons();
            }
        } catch (error) {
            console.error('Error removing bookmark:', error);
            showNotification('Failed to remove bookmark', 'error');
        }
    } else {
        // Add bookmark
        try {
            const response = await fetch(`${API_URL}/bookmarks/${scholarshipId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                addToBookmarks(scholarshipId);
                showNotification('Bookmark added!');
                refreshBookmarkButtons();
            }
        } catch (error) {
            console.error('Error adding bookmark:', error);
            showNotification('Failed to add bookmark', 'error');
        }
    }
}

// Add to bookmarks
function addToBookmarks(scholarshipId) {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    scholarshipId = Number(scholarshipId);
    if (!bookmarks.includes(scholarshipId)) {
        bookmarks.push(scholarshipId);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
}

// Remove from bookmarks
function removeFromBookmarks(scholarshipId) {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    scholarshipId = Number(scholarshipId);
    bookmarks = bookmarks.filter(id => id !== scholarshipId);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// Refresh bookmark buttons
function refreshBookmarkButtons() {
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        const onClick = btn.getAttribute('onclick');
        if (onClick) {
            const match = onClick.match(/toggleBookmark\((\d+)\)/);
            if (match) {
                const id = parseInt(match[1]);
                btn.textContent = isBookmarked(id) ? '★' : '☆';
                btn.classList.toggle('active', isBookmarked(id));
            }
        }
    });
}

// ============= NOTIFICATION FUNCTIONS =============

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
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

// ============= INITIALIZATION =============

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Load scholarships if on scholarships page
    if (window.location.pathname.includes('scholarships.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search');
        const category = urlParams.get('category');
        
        if (search) {
            document.getElementById('search-input').value = search;
            loadScholarships({ search });
        } else if (category) {
            document.getElementById('filter-category').value = category;
            loadScholarships({ category });
        } else {
            loadScholarships();
        }
    }
});

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('scholarship-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}