/**
 * TeenShield MySQL Database Setup
 * ─────────────────────────────────
 * Run: node setup.js
 * Requires: npm install mysql2 dotenv
 *
 * Environment variables (.env):
 *   DB_HOST=localhost
 *   DB_USER=root
 *   DB_PASSWORD=yourpassword
 *   DB_NAME=teenshield
 *   DB_PORT=3306
 */
const mysql = require("mysql2/promise");
require("dotenv").config();
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "3306"),
  multipleStatements: true,
};
const DB_NAME = process.env.DB_NAME || "teenshield";
const SCHEMA = `
-- ══════════════════════════════════════
-- TeenShield Database Schema
-- ══════════════════════════════════════
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
USE \`${DB_NAME}\`;
-- ── Users ───────────────────────────
CREATE TABLE IF NOT EXISTS teen_users (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  age         TINYINT UNSIGNED NOT NULL,
  balance     DECIMAL(12, 2) DEFAULT 0.00,
  risk_score  FLOAT DEFAULT 0,
  freeze_probability FLOAT DEFAULT 0,
  state       VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS parent_users (
  id    VARCHAR(36) PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS parent_teen_links (
  parent_id VARCHAR(36) NOT NULL,
  teen_id   VARCHAR(36) NOT NULL,
  PRIMARY KEY (parent_id, teen_id),
  FOREIGN KEY (parent_id) REFERENCES parent_users(id) ON DELETE CASCADE,
  FOREIGN KEY (teen_id)   REFERENCES teen_users(id)   ON DELETE CASCADE
);
-- ── Transactions ────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                    VARCHAR(36) PRIMARY KEY,
  teen_id               VARCHAR(36) NOT NULL,
  sender_id             VARCHAR(100) NOT NULL,
  sender_name           VARCHAR(100) NOT NULL,
  sender_state          VARCHAR(50) NOT NULL,
  receiver_state        VARCHAR(50) NOT NULL,
  cross_state_flag      BOOLEAN DEFAULT FALSE,
  amount                DECIMAL(12, 2) NOT NULL,
  type                  ENUM('incoming', 'outgoing', 'investment') NOT NULL,
  scam_category         ENUM('crypto_mining', 'forex_trading', 'betting_app', 'ponzi_investment', 'mule_chain', 'none') DEFAULT 'none',
  mule_probability      FLOAT DEFAULT 0,
  freeze_probability    FLOAT DEFAULT 0,
  risk_score            FLOAT DEFAULT 0,
  status                ENUM('completed', 'paused', 'rejected', 'pending_parent') DEFAULT 'pending_parent',
  parent_approval_required BOOLEAN DEFAULT FALSE,
  teen_override_flag    BOOLEAN DEFAULT FALSE,
  description           TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teen_id) REFERENCES teen_users(id) ON DELETE CASCADE
);
-- ── Fraud Analysis (ML results) ─────
CREATE TABLE IF NOT EXISTS fraud_analysis (
  id                 VARCHAR(36) PRIMARY KEY,
  transaction_id     VARCHAR(36) NOT NULL UNIQUE,
  risk_score         FLOAT NOT NULL,
  risk_level         ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
  scam_type          VARCHAR(50) NOT NULL,
  freeze_probability FLOAT NOT NULL,
  mule_probability   FLOAT DEFAULT 0,
  model_version      VARCHAR(20) DEFAULT '1.0.0',
  analyzed_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
-- ── Alerts ──────────────────────────
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id              VARCHAR(36) PRIMARY KEY,
  teen_id         VARCHAR(36) NOT NULL,
  transaction_id  VARCHAR(36) NOT NULL,
  message         TEXT NOT NULL,
  severity        ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teen_id)        REFERENCES teen_users(id)    ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)  ON DELETE CASCADE
);
-- ── Risk History ────────────────────
CREATE TABLE IF NOT EXISTS risk_history (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  teen_id            VARCHAR(36) NOT NULL,
  risk_score         FLOAT NOT NULL,
  freeze_probability FLOAT NOT NULL,
  recorded_at        DATE NOT NULL,
  FOREIGN KEY (teen_id) REFERENCES teen_users(id) ON DELETE CASCADE,
  INDEX idx_teen_date (teen_id, recorded_at)
);
-- ── Indexes ─────────────────────────
-- (Commented out to prevent duplicate errors on subsequent runs)
-- CREATE INDEX idx_txn_teen      ON transactions(teen_id);
-- CREATE INDEX idx_txn_status    ON transactions(status);
-- CREATE INDEX idx_txn_created   ON transactions(created_at);
-- CREATE INDEX idx_alerts_teen   ON fraud_alerts(teen_id);
-- CREATE INDEX idx_alerts_unread ON fraud_alerts(is_read, teen_id);
`;
async function main() {
  let connection;
  try {
    console.log("🔌 Connecting to MySQL...");
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("🏗️  Creating database & tables...");
    await connection.query(SCHEMA);
    console.log(`✅ Database '${DB_NAME}' ready with all tables:`);
    const [rows] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [DB_NAME]
    );
    rows.forEach((r) => console.log(`   • ${r.TABLE_NAME}`));

    // Insert Mock Data for demo functionality
    console.log("📝 Inserting 18 structured Indian dummy teens and 4 parent accounts...");

    // Clear old data to prevent dupes
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE fraud_alerts');
    await connection.query('TRUNCATE TABLE transactions');
    await connection.query('TRUNCATE TABLE parent_teen_links');
    await connection.query('TRUNCATE TABLE teen_users');
    await connection.query('TRUNCATE TABLE parent_users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.query(`
        INSERT INTO teen_users (id, name, age, balance, risk_score, freeze_probability, state) VALUES
        -- 🔴 3 High Risk Teens (Risk > 80)
        ('teen-001', 'Aarav', 16, 1200.00, 92.5, 85.0, 'MH'),
        ('teen-002', 'Vivaan', 17, 300.50, 88.0, 75.0, 'DL'),
        ('teen-003', 'Aditya', 15, 80.00, 85.0, 80.0, 'KA'),
        
        -- 🟡 5 Medium Risk Teens (Risk 40-70)
        ('teen-004', 'Vihaan', 16, 420.00, 55.0, 30.0, 'TN'),
        ('teen-005', 'Arjun', 17, 900.00, 48.0, 25.0, 'UP'),
        ('teen-006', 'Ananya', 15, 250.75, 60.0, 35.0, 'GJ'),
        ('teen-007', 'Diya', 14, 550.00, 45.0, 20.0, 'RJ'),
        ('teen-008', 'Aditi', 16, 600.00, 50.0, 28.0, 'WB'),
        
        -- 🟢 10 Low Risk Teens (Risk < 20)
        ('teen-009', 'Kavya', 17, 1800.50, 10.0, 2.0, 'TS'),
        ('teen-010', 'Riya', 15, 950.00, 5.0, 0.0, 'AP'),
        ('teen-011', 'Ishaan', 16, 420.00, 15.0, 5.0, 'MH'),
        ('teen-012', 'Rhea', 17, 2100.00, 8.0, 1.0, 'KA'),
        ('teen-013', 'Kabir', 16, 300.00, 12.0, 3.0, 'DL'),
        ('teen-014', 'Shaurya', 15, 850.00, 6.0, 0.0, 'UP'),
        ('teen-015', 'Meera', 14, 120.00, 18.0, 8.0, 'GJ'),
        ('teen-016', 'Neha', 17, 2400.00, 4.0, 0.0, 'RJ'),
        ('teen-017', 'Aryan', 16, 700.00, 9.0, 1.0, 'WB'),
        ('teen-018', 'Rohan', 15, 110.00, 11.0, 2.0, 'TS');
    `);

    await connection.query(`
        INSERT INTO parent_users (id, name, email) VALUES
        ('parent-001', 'Rajesh', 'rajesh@example.com'),
        ('parent-002', 'Priya', 'priya@example.com'),
        ('parent-003', 'Amit', 'amit@example.com'),
        ('parent-004', 'Sunita', 'sunita@example.com');
    `);

    await connection.query(`
        INSERT IGNORE INTO parent_teen_links (parent_id, teen_id) VALUES
        -- Rajesh manages high risk teens
        ('parent-001', 'teen-001'),
        ('parent-001', 'teen-002'),
        ('parent-001', 'teen-003'),
        ('parent-001', 'teen-004'),
        
        -- Priya manages medium/low
        ('parent-002', 'teen-005'),
        ('parent-002', 'teen-006'),
        ('parent-002', 'teen-007'),
        ('parent-002', 'teen-008'),
        ('parent-002', 'teen-009'),
        
        -- Amit & Sunita manage the rest (low risk)
        ('parent-003', 'teen-010'),
        ('parent-003', 'teen-011'),
        ('parent-003', 'teen-012'),
        ('parent-003', 'teen-013'),
        ('parent-003', 'teen-014'),
        ('parent-004', 'teen-015'),
        ('parent-004', 'teen-016'),
        ('parent-004', 'teen-017'),
        ('parent-004', 'teen-018');
    `);

    console.log("✅ Mock data inserted!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}
main();
