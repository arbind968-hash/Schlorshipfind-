const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yourpassword',
    database: process.env.DB_NAME || 'scholarfind',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Test database connection
async function testDBConnection() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ MySQL Database connected successfully');
    } catch (error) {
        console.error('❌ MySQL Database connection failed:', error.message);
        process.exit(1);
    }
}
testDBConnection();

// ============ JWT MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'scholarfind-super-secret-key-2024', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

const isAdmin = async (req, res, next) => {
    try {
        const [users] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [req.user.userId]
        );
        
        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
        
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============ AUTH ROUTES ============

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user exists
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'user']
        );
        
        // Create token
        const token = jwt.sign(
            { userId: result.insertId, email, role: 'user' },
            process.env.JWT_SECRET || 'scholarfind-super-secret-key-2024',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: result.insertId,
                name,
                email,
                role: 'user'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Get user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = users[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'scholarfind-super-secret-key-2024',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ============ SCHOLARSHIP ROUTES ============

// GET ALL SCHOLARSHIPS (PUBLIC)
app.get('/api/scholarships', async (req, res) => {
    try {
        let query = 'SELECT * FROM scholarships WHERE 1=1';
        const params = [];
        
        const { category, minAmount, maxAmount, location, search, limit } = req.query;
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (minAmount) {
            query += ' AND amount >= ?';
            params.push(minAmount);
        }
        
        if (maxAmount) {
            query += ' AND amount <= ?';
            params.push(maxAmount);
        }
        
        if (location) {
            query += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }
        
        if (search) {
            query += ' AND (title LIKE ? OR provider LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY created_at DESC';
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }
        
        const [scholarships] = await pool.query(query, params);
        res.json(scholarships);
    } catch (error) {
        console.error('Get scholarships error:', error);
        res.status(500).json({ error: 'Failed to load scholarships' });
    }
});

// GET SINGLE SCHOLARSHIP (PUBLIC)
app.get('/api/scholarships/:id', async (req, res) => {
    try {
        const [scholarships] = await pool.query(
            'SELECT * FROM scholarships WHERE id = ?',
            [req.params.id]
        );
        
        if (scholarships.length === 0) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        
        res.json(scholarships[0]);
    } catch (error) {
        console.error('Get scholarship error:', error);
        res.status(500).json({ error: 'Failed to load scholarship' });
    }
});

// ADD SCHOLARSHIP (ADMIN ONLY)
app.post('/api/scholarships', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            title,
            provider,
            category,
            amount,
            deadline,
            eligibility,
            location,
            description
        } = req.body;
        
        // Validation
        if (!title || !provider || !category || !amount || !deadline || !eligibility || !location || !description) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO scholarships 
            (title, provider, category, amount, deadline, eligibility, location, description, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, provider, category, amount, deadline, eligibility, location, description, req.user.userId]
        );
        
        res.status(201).json({
            message: 'Scholarship added successfully!',
            id: result.insertId
        });
    } catch (error) {
        console.error('Add scholarship error:', error);
        res.status(500).json({ error: 'Failed to add scholarship' });
    }
});

// UPDATE SCHOLARSHIP (ADMIN ONLY)
app.put('/api/scholarships/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            title,
            provider,
            category,
            amount,
            deadline,
            eligibility,
            location,
            description
        } = req.body;
        
        await pool.query(
            `UPDATE scholarships 
            SET title = ?, provider = ?, category = ?, amount = ?, 
                deadline = ?, eligibility = ?, location = ?, description = ?
            WHERE id = ?`,
            [title, provider, category, amount, deadline, eligibility, location, description, req.params.id]
        );
        
        res.json({ message: 'Scholarship updated successfully!' });
    } catch (error) {
        console.error('Update scholarship error:', error);
        res.status(500).json({ error: 'Failed to update scholarship' });
    }
});

// DELETE SCHOLARSHIP (ADMIN ONLY)
app.delete('/api/scholarships/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM scholarships WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ message: 'Scholarship deleted successfully!' });
    } catch (error) {
        console.error('Delete scholarship error:', error);
        res.status(500).json({ error: 'Failed to delete scholarship' });
    }
});

// ============ BOOKMARK ROUTES ============

// GET USER BOOKMARKS
app.get('/api/bookmarks', authenticateToken, async (req, res) => {
    try {
        const [bookmarks] = await pool.query(
            `SELECT s.* FROM scholarships s
            INNER JOIN bookmarks b ON s.id = b.scholarship_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC`,
            [req.user.userId]
        );
        
        res.json(bookmarks);
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ error: 'Failed to load bookmarks' });
    }
});

// ADD BOOKMARK
app.post('/api/bookmarks/:scholarshipId', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'INSERT INTO bookmarks (user_id, scholarship_id) VALUES (?, ?)',
            [req.user.userId, req.params.scholarshipId]
        );
        
        res.json({ message: 'Bookmark added successfully!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Already bookmarked' });
        }
        console.error('Add bookmark error:', error);
        res.status(500).json({ error: 'Failed to add bookmark' });
    }
});

// REMOVE BOOKMARK
app.delete('/api/bookmarks/:scholarshipId', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM bookmarks WHERE user_id = ? AND scholarship_id = ?',
            [req.user.userId, req.params.scholarshipId]
        );
        
        res.json({ message: 'Bookmark removed successfully!' });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

// ============ ADMIN STATS ============
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [[scholarshipCount]] = await pool.query(
            'SELECT COUNT(*) as total FROM scholarships'
        );
        
        const [[userCount]] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE role = ?',
            ['user']
        );
        
        const [[amountTotal]] = await pool.query(
            'SELECT SUM(amount) as total FROM scholarships'
        );
        
        res.json({
            totalScholarships: scholarshipCount.total,
            totalUsers: userCount.total,
            totalAmount: amountTotal.total || 0
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ScholarFind API is running',
        timestamp: new Date().toISOString()
    });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║     🚀 ScholarFind API IS LIVE!          ║
    ║     Port: ${PORT}                           ║
    ║     URL: http://localhost:${PORT}          ║
    ║     Status: ✅ RUNNING                   ║
    ╚══════════════════════════════════════════╝
    `);
});