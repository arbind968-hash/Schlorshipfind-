// API Base URL
const API_URL = 'http://localhost:5000/api';

// Login Form Handler
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'scholarships.html';
                }
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Server error. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

// Admin Login Handler - Exactly matching your wireframe
if (document.getElementById('admin-login-form')) {
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('admin-error');
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (data.user.role === 'admin') {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'admin-dashboard.html';
                } else {
                    errorDiv.textContent = 'Admin access required';
                    errorDiv.style.display = 'block';
                }
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Admin login error:', error);
            errorDiv.textContent = 'Server error. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

// Signup Handler
if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('signup-error');
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'scholarships.html';
            } else {
                errorDiv.textContent = data.error || 'Registration failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Signup error:', error);
            errorDiv.textContent = 'Server error. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}