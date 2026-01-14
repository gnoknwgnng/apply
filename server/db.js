const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Contacts Table
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hashed_contact TEXT UNIQUE NOT NULL,
      type TEXT CHECK(type IN ('phone', 'email')) NOT NULL,
      report_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'safe',
      last_reported_at DATETIME
    )`);

        // Reports Table
        db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      fraud_type TEXT NOT NULL,
      description TEXT,
      proof_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts (id)
    )`);

        // Removal Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS removal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_identifier TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        console.log('Database tables initialized.');
    });
}

module.exports = db;
