require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_demo';

app.use(cors());
app.use(express.json());

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'SAKSHITHA',
    database: process.env.DB_NAME || 'teenshield',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ── Auth Endpoints ──
// Basic login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        let user;
        if (role === 'teen') {
            // Map email to name by taking string before @ and capitalizing first letter
            const nameFromEmail = email.split('@')[0];
            const nameToSearch = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

            const [rows] = await pool.query('SELECT * FROM teen_users WHERE name = ?', [nameToSearch]);
            if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
            user = rows[0];
            user.role = 'teen';
        } else {
            const [rows] = await pool.query('SELECT * FROM parent_users WHERE email = ?', [email]);
            if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
            user = rows[0];
            user.role = 'parent';
        }

        const token = jwt.sign(
            { id: user.id, email: user.email || user.name, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── Data Retrieval Endpoints ──
// Get logged-in user's profile and dashboard stats
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        let users = [];
        if (req.user.role === 'teen') {
            [users] = await pool.query('SELECT * FROM teen_users WHERE id = ?', [req.user.id]);
        } else {
            [users] = await pool.query('SELECT * FROM parent_users WHERE id = ?', [req.user.id]);
        }

        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const userStats = users[0];
        if (req.user.role === 'teen') {
            userStats.balance = parseFloat(userStats.balance);
            userStats.freeze_probability = parseFloat(userStats.freeze_probability);
            userStats.risk_score = parseFloat(userStats.risk_score);
        }

        res.json(userStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Get user's transactions
app.get('/api/users/transactions', authenticateToken, async (req, res) => {
    try {
        let transactions = [];
        if (req.user.role === 'teen') {
            [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE teen_id = ? ORDER BY created_at DESC',
                [req.user.id]
            );
        } else {
            // For parent, get transactions for all linked teens
            [transactions] = await pool.query(
                `SELECT t.* FROM transactions t 
                 JOIN parent_teen_links ptl ON t.teen_id = ptl.teen_id 
                 WHERE ptl.parent_id = ? ORDER BY t.created_at DESC`,
                [req.user.id]
            );
        }

        // Ensure amounts are numbers and map for frontend
        const formatted = transactions.map(t => ({
            ...t,
            amount: parseFloat(t.amount),
            freeze_probability: parseFloat(t.freeze_probability),
            timestamp: t.created_at, // API backward compatibility
            scamCategory: t.scam_category,
            riskScore: t.risk_score,
            senderName: t.sender_name
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get user's active alerts
app.get('/api/users/alerts', authenticateToken, async (req, res) => {
    try {
        let alerts = [];
        if (req.user.role === 'teen') {
            [alerts] = await pool.query(
                'SELECT * FROM fraud_alerts WHERE teen_id = ? ORDER BY created_at DESC',
                [req.user.id]
            );
        } else {
            [alerts] = await pool.query(
                `SELECT a.* FROM fraud_alerts a
                 JOIN parent_teen_links ptl ON a.teen_id = ptl.teen_id 
                 WHERE ptl.parent_id = ? ORDER BY a.created_at DESC`,
                [req.user.id]
            );
        }
        res.json(alerts.map(a => ({ ...a, timestamp: a.created_at }))); // API mapping
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Allow a teen to submit a new transaction (This ties into the ML backend theoretically)
app.post('/api/users/transactions', authenticateToken, async (req, res) => {
    try {
        const { recipient, amount, description, risk_score, freeze_probability, scam_category, status, cross_state_flag, receiver_state } = req.body;
        const txId = 'tx-' + Date.now();

        await pool.query(
            `INSERT INTO transactions 
            (id, teen_id, sender_id, sender_name, sender_state, receiver_state, cross_state_flag, amount, type, description, status, risk_score, freeze_probability, scam_category) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [txId, req.user.id, recipient, recipient, 'NA', receiver_state || 'NA', cross_state_flag ? 1 : 0, amount, 'outgoing', description, status || 'pending_parent', risk_score, freeze_probability, scam_category]
        );

        // Only deduct balance if completed immediately
        if (status === 'completed') {
            await pool.query('UPDATE teen_users SET balance = balance - ? WHERE id = ?', [amount, req.user.id]);
        }

        // Match User flow: Insert full ML results into fraud_analysis
        const risk_level = risk_score > 75 ? 'HIGH' : (risk_score > 40 ? 'MEDIUM' : 'LOW');
        await pool.query(
            `INSERT INTO fraud_analysis (id, transaction_id, risk_score, risk_level, scam_type, freeze_probability, mule_probability)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['fa-' + Date.now(), txId, risk_score, risk_level, scam_category, freeze_probability, req.body.mule_probability || 0]
        );

        // Match User flow: Insert into risk_history trend tracking
        await pool.query(
            `INSERT INTO risk_history (teen_id, risk_score, freeze_probability, recorded_at) VALUES (?, ?, ?, CURDATE())`,
            [req.user.id, risk_score, freeze_probability]
        );

        // Let's spawn an alert if it was high risk!
        if (risk_score > 75) {
            const severity = risk_score > 90 ? 'critical' : 'high';
            const alertMsg = `High risk (${risk_score}) transaction flagged: $${amount} to ${recipient}.`;
            await pool.query(
                `INSERT INTO fraud_alerts (id, teen_id, transaction_id, message, severity) VALUES (?, ?, ?, ?, ?)`,
                ['alert-' + Date.now(), req.user.id, txId, alertMsg, severity]
            );

            // 🔔 Simulated External SMS Notification
            console.log('\n📱 --- SMS NOTIFICATION DISPATCHED ---');
            console.log(`To: Parent of User ${req.user.id}`);
            console.log(`Msg: TEENSHIELD ALERT: A high-risk transaction of $${amount} to ${recipient} was paused. Please review in your Parent Dashboard.`);
            console.log('--------------------------------------\n');
        }

        res.status(201).json({ id: txId, message: 'Transaction submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

// Parent Approval/Rejection Endpoint
app.put('/api/transactions/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'Only parents can approve transactions' });
        }

        const txId = req.params.id;
        const { status } = req.body; // 'completed' or 'rejected'

        if (!['completed', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Verify the parent actually owns this teen
        const [txs] = await pool.query(
            `SELECT t.* FROM transactions t
             JOIN parent_teen_links ptl ON t.teen_id = ptl.teen_id
             WHERE t.id = ? AND ptl.parent_id = ?`,
            [txId, req.user.id]
        );

        if (txs.length === 0) {
            return res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }

        const tx = txs[0];

        // Update status
        await pool.query('UPDATE transactions SET status = ? WHERE id = ?', [status, txId]);

        // If approved, deduct balance
        if (status === 'completed' && tx.status !== 'completed') {
            await pool.query('UPDATE teen_users SET balance = balance - ? WHERE id = ?', [tx.amount, tx.teen_id]);

            // Notify teen
            await pool.query(
                `INSERT INTO fraud_alerts (id, teen_id, transaction_id, message, severity) VALUES (?, ?, ?, ?, ?)`,
                ['alert-' + Date.now(), tx.teen_id, txId, `Your pending transaction of $${tx.amount} to ${tx.recipient || tx.sender_name} was APPROVED by your parent.`, 'low']
            );
        } else if (status === 'rejected') {
            // Notify teen
            await pool.query(
                `INSERT INTO fraud_alerts (id, teen_id, transaction_id, message, severity) VALUES (?, ?, ?, ?, ?)`,
                ['alert-' + Date.now(), tx.teen_id, txId, `Your pending transaction of $${tx.amount} to ${tx.recipient || tx.sender_name} was REJECTED by your parent.`, 'critical']
            );
        }

        res.json({ message: `Transaction ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});


// Add a health check
app.get('/health', (req, res) => {
    res.json({ status: 'API is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 TeenShield Node API running on port ${PORT}`);
});
