import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'portal.db');

let db;

export async function initDB() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('CSL','XDSS','JDSS')),
    country TEXT DEFAULT 'India',
    region TEXT NOT NULL,
    state TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    must_change_password INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add columns if upgrading from old DB
  try { db.run("ALTER TABLE employees ADD COLUMN country TEXT DEFAULT 'India'"); } catch {}
  try { db.run("ALTER TABLE employees ADD COLUMN must_change_password INTEGER DEFAULT 0"); } catch {}

  db.run(`CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    week INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(employee_id),
    UNIQUE(employee_id, week, year)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed settings
  const settingsCheck = db.exec("SELECT value FROM settings WHERE key='campaign_name'");
  if (!settingsCheck.length || !settingsCheck[0].values.length) {
    db.run("INSERT OR IGNORE INTO settings VALUES ('campaign_name', 'Tez-Tarakki Stars')");
    db.run("INSERT OR IGNORE INTO settings VALUES ('tagline', 'Outperform Your Yesterday')");
  }

  // Seed admins
  const adminCheck = db.exec("SELECT COUNT(*) as cnt FROM admins");
  if (adminCheck[0].values[0][0] === 0) {
    const hash1 = bcrypt.hashSync('Admin@123', 10);
    const hash2 = bcrypt.hashSync('Admin@456', 10);
    const hash3 = bcrypt.hashSync('Admin@789', 10);
    db.run("INSERT INTO admins (username, password_hash, name) VALUES ('admin1', ?, 'Admin One')", [hash1]);
    db.run("INSERT INTO admins (username, password_hash, name) VALUES ('admin2', ?, 'Admin Two')", [hash2]);
    db.run("INSERT INTO admins (username, password_hash, name) VALUES ('admin3', ?, 'Admin Three')", [hash3]);
  }

  saveDB();
  console.log('✅ Database ready');
  return db;
}

export function saveDB() {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

export function getDB() { return db; }