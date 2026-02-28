-- TeenShield MySQL Schema
CREATE DATABASE IF NOT EXISTS teenshield;
USE teenshield;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS Alerts;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('teen', 'parent') NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    risk_score INT DEFAULT 0,
    freeze_probability DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE Transactions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status ENUM('completed', 'pending', 'declined') DEFAULT 'completed',
    risk_score INT DEFAULT 0,
    freeze_probability DECIMAL(5, 2) DEFAULT 0.00,
    scam_category VARCHAR(50) DEFAULT 'none',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Alerts Table
CREATE TABLE Alerts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Insert Demo Users
-- Note: In a real app, passwords would be properly hashed via bcrypt.
-- For this demo script, we insert plain text hashes that the API will verify against
INSERT INTO Users (id, name, email, password_hash, role, balance, risk_score, freeze_probability) VALUES
('teen-001', 'Alex', 'alex@example.com', 'hashed_demo_password', 'teen', 450.00, 42, 12.5),
('teen-002', 'Jordan', 'jordan@example.com', 'hashed_demo_password', 'teen', 120.50, 85, 45.0),
('parent-001', 'Sarah', 'sarah@example.com', 'hashed_demo_password', 'parent', 0.00, 0, 0.0);

-- Insert initial demo transactions
INSERT INTO Transactions (id, user_id, recipient, amount, description, status, risk_score, freeze_probability, scam_category, timestamp) VALUES
('tx-101', 'teen-001', 'Steam Games', 49.99, 'Gaming', 'completed', 15, 2.0, 'none', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('tx-102', 'teen-001', 'Pizza Hut', 24.50, 'Food', 'completed', 5, 1.0, 'none', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('tx-103', 'teen-002', 'CryptoXChange', 200.00, 'Investment', 'pending', 85, 45.0, 'crypto_mining', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- Insert initial demo alerts
INSERT INTO Alerts (id, user_id, message, severity, timestamp) VALUES
('al-101', 'teen-001', 'Your payment to Steam Games was successful.', 'info', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('al-102', 'teen-002', 'Unusual cryptocurrency transfer detected. Waiting for parent approval.', 'critical', DATE_SUB(NOW(), INTERVAL 2 HOUR));
