import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'portal.db');

const SQL = await initSqlJs();
const fileBuffer = readFileSync(DB_PATH);
const db = new SQL.Database(fileBuffer);

db.run("DELETE FROM points");
db.run("DELETE FROM employees");

const data = db.export();
writeFileSync(DB_PATH, Buffer.from(data));

console.log("✅ All employees and installations cleared. Admins and settings kept.");