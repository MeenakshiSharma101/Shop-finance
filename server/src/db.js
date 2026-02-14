const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || "./shop_finance.db";
const resolvedPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(__dirname, "..", dbPath);

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    pin_hash TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    description TEXT,
    payment_mode TEXT DEFAULT 'cash',
    sale_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    description TEXT,
    payment_mode TEXT DEFAULT 'cash',
    expense_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, sale_date);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);
`);

module.exports = db;
