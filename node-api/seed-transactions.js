require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid'); // Need to install uuid, or we can use crypto.randomUUID

const crypto = require('crypto');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'SAKSHITHA',
    database: process.env.DB_NAME || 'teenshield',
};

const SCAM_CATEGORIES = ['crypto_mining', 'forex_trading', 'betting_app', 'ponzi_investment', 'mule_chain', 'none'];
const MERCHANTS = [
    { name: 'Amazon', state: 'WA' },
    { name: 'Starbucks', state: 'WA' },
    { name: 'Target', state: 'MN' },
    { name: 'Walmart', state: 'AR' },
    { name: 'Apple Store', state: 'CA' },
    { name: 'Netflix', state: 'CA' },
    { name: 'Steam', state: 'WA' },
    { name: 'Epic Games', state: 'NC' },
    { name: 'Nike', state: 'OR' },
    { name: 'Spotify', state: 'NY' },
    { name: 'Uber Eats', state: 'CA' },
    { name: 'DoorDash', state: 'CA' },
    { name: 'Crypto.com', state: 'NY' },
    { name: 'Binance', state: 'NY' },
    { name: 'FX Empire', state: 'TX' },
    { name: 'BetMGM', state: 'NV' },
    { name: 'DraftKings', state: 'MA' },
    { name: 'Venmo Transfer', state: 'CA' },
    { name: 'CashApp Transfer', state: 'CA' },
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
    let connection;
    try {
        console.log("🔌 Connecting to MySQL...");
        connection = await mysql.createConnection(DB_CONFIG);

        // Get all teens
        const [teens] = await connection.query('SELECT id, name, state FROM teen_users');
        if (teens.length === 0) {
            console.log("⚠️ No teens found. Run setup.js first.");
            return;
        }

        console.log(`🧑 Found ${teens.length} teens. Generating transactions...`);

        const transactionsToInsert = [];
        const alertsToInsert = [];
        const analysisToInsert = [];
        const riskHistoryToInsert = [];

        for (const teen of teens) {
            const numTx = randomInt(8, 15); // 8-15 transactions per teen

            for (let i = 0; i < numTx; i++) {
                // Determine probability based on the structured data tiers
                let fraudProb = 0.02; // 2% for Low Risk
                if (teen.risk_score >= 80) fraudProb = 0.65; // 65% for High Risk
                else if (teen.risk_score >= 40) fraudProb = 0.20; // 20% for Medium Risk

                const isFraud = Math.random() < fraudProb;
                const merchant = randomChoice(MERCHANTS);
                const isCrossState = teen.state !== merchant.state;

                let amount, type, scamCat, riskScore, freezeProb, status, muleProb;

                if (isFraud) {
                    amount = randomFloat(100, 1500); // larger amounts
                    type = randomChoice(['outgoing', 'investment']);
                    scamCat = randomChoice(SCAM_CATEGORIES.filter(c => c !== 'none'));
                    riskScore = randomFloat(60, 99);
                    freezeProb = randomFloat(50, 95);
                    muleProb = scamCat === 'mule_chain' ? randomFloat(70, 99) : randomFloat(0, 30);
                    status = riskScore > 85 ? 'paused' : 'pending_parent';

                    // Generate an alert
                    const txId = crypto.randomUUID();
                    const txDate = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000); // random date in last 30 days

                    transactionsToInsert.push([
                        txId, teen.id, crypto.randomUUID().slice(0, 8), merchant.name, merchant.state, teen.state,
                        isCrossState, amount, type, scamCat, muleProb, freezeProb, riskScore, status,
                        true, false, `Suspicious payment to ${merchant.name}`,
                        txDate
                    ]);

                    let severity = riskScore > 90 ? 'critical' : (riskScore > 75 ? 'high' : 'medium');
                    alertsToInsert.push([
                        crypto.randomUUID(), teen.id, txId,
                        `High risk (${riskScore}) transaction flagged for ${scamCat.replace('_', ' ')}: $${amount} to ${merchant.name}.`,
                        severity, false, new Date()
                    ]);

                    const riskLevel = riskScore > 75 ? 'HIGH' : 'MEDIUM';
                    analysisToInsert.push([
                        crypto.randomUUID(), txId, riskScore, riskLevel, scamCat, freezeProb, muleProb, txDate
                    ]);

                    riskHistoryToInsert.push([
                        teen.id, riskScore, freezeProb, txDate
                    ]);
                } else {
                    amount = randomFloat(5, 150);
                    type = Math.random() < 0.8 ? 'outgoing' : 'incoming';
                    scamCat = 'none';
                    riskScore = randomFloat(1, 25);
                    freezeProb = randomFloat(0, 10);
                    muleProb = randomFloat(0, 5);
                    status = 'completed';

                    const txId = crypto.randomUUID();
                    const txDate = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000);

                    transactionsToInsert.push([
                        txId, teen.id, crypto.randomUUID().slice(0, 8), merchant.name, merchant.state, teen.state,
                        isCrossState, amount, type, scamCat, muleProb, freezeProb, riskScore, status,
                        false, false, `Payment to ${merchant.name}`,
                        txDate
                    ]);

                    analysisToInsert.push([
                        crypto.randomUUID(), txId, riskScore, 'LOW', scamCat, freezeProb, muleProb, txDate
                    ]);

                    riskHistoryToInsert.push([
                        teen.id, riskScore, freezeProb, txDate
                    ]);
                }
            }
        }

        console.log(`💳 Inserting ${transactionsToInsert.length} transactions...`);
        if (transactionsToInsert.length > 0) {
            await connection.query(
                `INSERT INTO transactions (id, teen_id, sender_id, sender_name, sender_state, receiver_state, cross_state_flag, amount, type, scam_category, mule_probability, freeze_probability, risk_score, status, parent_approval_required, teen_override_flag, description, created_at) VALUES ?`,
                [transactionsToInsert]
            );
        }

        console.log(`🚨 Inserting ${alertsToInsert.length} alerts...`);
        if (alertsToInsert.length > 0) {
            await connection.query(
                `INSERT INTO fraud_alerts (id, teen_id, transaction_id, message, severity, is_read, created_at) VALUES ?`,
                [alertsToInsert]
            );
        }

        console.log(`🧠 Inserting ${analysisToInsert.length} ML analysis records...`);
        if (analysisToInsert.length > 0) {
            await connection.query(
                `INSERT INTO fraud_analysis (id, transaction_id, risk_score, risk_level, scam_type, freeze_probability, mule_probability, analyzed_at) VALUES ?`,
                [analysisToInsert]
            );
        }

        console.log(`📈 Inserting ${riskHistoryToInsert.length} risk history trends...`);
        if (riskHistoryToInsert.length > 0) {
            await connection.query(
                `INSERT INTO risk_history (teen_id, risk_score, freeze_probability, recorded_at) VALUES ?`,
                [riskHistoryToInsert]
            );
        }

        console.log("✅ Data successfully generated and inserted!");

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        if (connection) await connection.end();
    }
}

seedData();
