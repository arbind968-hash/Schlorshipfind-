// Check if user is admin
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Load dashboard stats
async function loadDashboardStats() {
    if (!checkAdminAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            document.getElementById('total-scholarships').textContent = stats.totalScholarships;
            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('total-amount').textContent = `$${stats.totalAmount.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load scholarships for admin table
async function loadAdminScholarships() {
    if (!checkAdminAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/scholarships`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const scholarships = await response.json();
            const tbody = document.getElementById('scholarship-table-body');
            
            tbody.innerHTML = scholarships.map(s => `
                <tr>
                    <td>${s.title}</td>
                    <td>${s.provider}</td>
                    <td>${s.category}</td>
                    <td>$${s.amount.toLocaleString()}</td>
                    <td>${new Date(s.deadline).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editScholarship(${s.id})" class="action-btn edit-btn">Edit</button>
                        <button onclick="deleteScholarship(${s.id})" class="action-btn delete-btn">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading scholarships:', error);
    }
}

// Add scholarship handler
if (document.getElementById('add-scholarship-form')) {
    document.getElementById('add-scholarship-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!checkAdminAuth()) return;
        
        const scholarship = {
            title: document.getElementById('scholarship-title').value,
            provider: document.getElementById('scholarship-provider').value,
            category: document.getElementById('scholarship-category').value,
            amount: parseFloat(document.getElementById('scholarship-amount').value),
            deadline: document.getElementById('scholarship-deadline').value,
            eligibility: document.getElementById('scholarship-eligibility').value,
            location: document.getElementById('scholarship-location').value,
            description: document.getElementById('scholarship-description').value
        };
        
        try {
            const response = await fetch(`${API_URL}/scholarships`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(scholarship)
            });
            
            if (response.ok) {
                alert('Scholarship added successfully!');
                e.target.reset();
                showSection('manage-scholarships');
                loadAdminScholarships();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to add scholarship');
            }
        } catch (error) {
            console.error('Error adding scholarship:', error);
            alert('Server error. Please try again.');
        }
    });
}

// Delete scholarship
async function deleteScholarship(id) {
    if (!confirm('Are you sure you want to delete this scholarship?')) return;
    
    try {
        const response = await fetch(`${API_URL}/scholarships/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            alert('Scholarship deleted successfully!');
            loadAdminScholarships();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete scholarship');
        }
    } catch (error) {
        console.error('Error deleting scholarship:', error);
        alert('Server error. Please try again.');
    }
}

// Edit scholarship
async function editScholarship(id) {
    try {
        const response = await fetch(`${API_URL}/scholarships/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const scholarship = await response.json();
            openEditModal(scholarship);
        }
    } catch (error) {
        console.error('Error fetching scholarship:', error);
    }
}

// Open edit modal
function openEditModal(scholarship) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-scholarship-form');
    
    form.innerHTML = `
        <div class="form-group">
            <label>Title</label>
            <input type="text" id="edit-title" value="${scholarship.title}" required>
        </div>
        <div class="form-group">
            <label>Provider</label>
            <input type="text" id="edit-provider" value="${scholarship.provider}" required>
        </div>
        <div class="form-group">
            <label>Category</label>
            <select id="edit-category" required>
                <option value="Engineering" ${scholarship.category === 'Engineering' ? 'selected' : ''}>Engineering</option>
                <option value="Medical" ${scholarship.category === 'Medical' ? 'selected' : ''}>Medical</option>
                <option value="Business" ${scholarship.category === 'Business' ? 'selected' : ''}>Business</option>
                <option value="Arts" ${scholarship.category === 'Arts' ? 'selected' : ''}>Arts</option>
                <option value="Computer Science" ${scholarship.category === 'Computer Science' ? 'selected' : ''}>Computer Science</option>
                <option value="Law" ${scholarship.category === 'Law' ? 'selected' : ''}>Law</option>
            </select>
        </div>
        <div class="form-group">
            <label>Amount ($)</label>
            <input type="number" id="edit-amount" value="${scholarship.amount}" required>
        </div>
        <div class="form-group">
            <label>Deadline</label>
            <input type="date" id="edit-deadline" value="${scholarship.deadline.split('T')[0]}" required>
        </div>
        <div class="form-group">
            <label>Location</label>
            <input type="text" id="edit-location" value="${scholarship.location}" required>
        </div>
        <div class="form-group">
            <label>Eligibility</label>
            <textarea id="edit-eligibility" rows="3" required>${scholarship.eligibility}</textarea>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="edit-description" rows="5" required>${scholarship.description}</textarea>
        </div>
        <button type="submit" class="btn-submit">Update Scholarship</button>
    `;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const updatedScholarship = {
            title: document.getElementById('edit-title').value,
            provider: document.getElementById('edit-provider').value,
            category: document.getElementById('edit-category').value,
            amount: parseFloat(document.getElementById('edit-amount').value),
            deadline: document.getElementById('edit-deadline').value,
            location: document.getElementById('edit-location').value,
            eligibility: document.getElementById('edit-eligibility').value,
            description: document.getElementById('edit-description').value
        };
        
        try {
            const response = await fetch(`${API_URL}/scholarships/${scholarship.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedScholarship)
            });
            
            if (response.ok) {
                alert('Scholarship updated successfully!');
                closeModal();
                loadAdminScholarships();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update scholarship');
            }
        } catch (error) {
            console.error('Error updating scholarship:', error);
            alert('Server error. Please try again.');
        }
    };
    
    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Show section
function showSection(section) {
    // Update sidebar
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Show section
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Load data based on section
    if (section === 'dashboard') {
        loadDashboardStats();
    } else if (section === 'manage-scholarships') {
        loadAdminScholarships();
    }
}

// Search admin scholarships
function searchAdminScholarships() {
    const searchTerm = document.getElementById('admin-search').value.toLowerCase();
    const rows = document.querySelectorAll('#scholarship-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin-dashboard.html')) {
        checkAdminAuth();
        loadDashboardStats();
    }
});