-- Create database
DROP DATABASE IF EXISTS scholarfind;
CREATE DATABASE scholarfind;
USE scholarfind;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scholarships table
CREATE TABLE scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    deadline DATE NOT NULL,
    eligibility TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bookmarks table
CREATE TABLE bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scholarship_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (user_id, scholarship_id)
);

-- INSERT DEFAULT ADMIN (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@scholarfind.com', '$2a$10$XgTQyYqQgRQqQgRQqQgRQuQyYqQgRQqQgRQqQgRQuQyYqQgRQqQ', 'admin');


-- CREATE TEST USER (password: password123)
INSERT INTO users (name, email, password, role) VALUES 
('Test User', 'user@example.com', '$2a$10$XgTQyYqQgRQqQgRQqQgRQuQyYqQgRQqQgRQqQgRQuQyYqQgRQqQ', 'user');

-- ADD SOME BOOKMARKS
INSERT INTO bookmarks (user_id, scholarship_id) VALUES 
(2, 1), (2, 3), (2, 5), (2, 7), (2, 9);

-- SHOW STATS
SELECT 'DATABASE READY!' as status;
SELECT CONCAT('Users: ', COUNT(*)) as info FROM users;
SELECT CONCAT('Scholarships: ', COUNT(*)) as info FROM scholarships;
SELECT CONCAT('Bookmarks: ', COUNT(*)) as info FROM bookmarks;