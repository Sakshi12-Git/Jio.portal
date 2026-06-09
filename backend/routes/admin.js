import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, unlinkSync } from 'fs';
import { getDB, saveDB } from '../db.js';
import { adminAuth, JWT_SECRET } from '../middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, 'logo' + path.extname(file.originalname)),
});
const uploadLogo = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
const activeSessions = new Map();

// Helper: get week of month (1-4) from current date
function getCurrentWeekOfMonth() {
  const day = new Date().getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const db = getDB();
  const result = db.exec(
    "SELECT id, username, password_hash, name FROM admins WHERE username = ?",
    [username]
  );

  if (!result.length || !result[0].values.length)
    return res.status(401).json({ error: 'Invalid credentials' });

  const [id, uname, hash, name] = result[0].values[0];
  if (!bcrypt.compareSync(password, hash))
    return res.status(401).json({ error: 'Invalid credentials' });

  const activeCount = activeSessions.size;
  if (activeCount >= 3 && !activeSessions.has(id)) {
    return res.status(403).json({ error: 'Maximum 3 admin sessions active. Please try again later.' });
  }

  const token = jwt.sign(
    { id, username: uname, name, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  activeSessions.set(id, { token, loginTime: Date.now() });
  return res.json({ token, admin: { id, username: uname, name } });
});

// POST /api/admin/logout
router.post('/logout', adminAuth, (req, res) => {
  activeSessions.delete(req.admin.id);
  res.json({ message: 'Logged out successfully' });
});

// GET /api/admin/settings
router.get('/settings', adminAuth, (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT key, value FROM settings");
  const settings = {};
  if (result.length) result[0].values.forEach(([k, v]) => { settings[k] = v; });
  res.json(settings);
});

// PUT /api/admin/settings
router.put('/settings', adminAuth, (req, res) => {
  const { campaign_name, tagline } = req.body;
  const db = getDB();
  if (campaign_name !== undefined)
    db.run("INSERT OR REPLACE INTO settings VALUES ('campaign_name', ?)", [campaign_name]);
  if (tagline !== undefined)
    db.run("INSERT OR REPLACE INTO settings VALUES ('tagline', ?)", [tagline]);
  saveDB();
  res.json({ message: 'Settings updated' });
});

// POST /api/admin/upload-logo
router.post('/upload-logo', adminAuth, uploadLogo.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/${req.file.filename}`;
  const db = getDB();
  db.run("INSERT OR REPLACE INTO settings VALUES ('logo_url', ?)", [logoUrl]);
  saveDB();
  res.json({ logo_url: logoUrl });
});

// DELETE /api/admin/upload-logo
router.delete('/upload-logo', adminAuth, (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT value FROM settings WHERE key='logo_url'");
  if (result.length && result[0].values.length) {
    const filePath = path.join(uploadsDir, path.basename(result[0].values[0][0]));
    if (existsSync(filePath)) try { unlinkSync(filePath); } catch {}
  }
  db.run("DELETE FROM settings WHERE key='logo_url'");
  saveDB();
  res.json({ message: 'Logo removed' });
});

// GET /api/admin/stats
router.get('/stats', adminAuth, (req, res) => {
  const db = getDB();
  const total = db.exec("SELECT COUNT(*) FROM employees WHERE active=1")[0].values[0][0];
  const csl = db.exec("SELECT COUNT(*) FROM employees WHERE category='CSL' AND active=1")[0].values[0][0];
  const xdss = db.exec("SELECT COUNT(*) FROM employees WHERE category='XDSS' AND active=1")[0].values[0][0];
  const jdss = db.exec("SELECT COUNT(*) FROM employees WHERE category='JDSS' AND active=1")[0].values[0][0];
  const adminsActive = activeSessions.size;
  res.json({ total, csl, xdss, jdss, adminsActive, maxAdmins: 3 });
});

// GET /api/admin/installation-stats
router.get('/installation-stats', adminAuth, (req, res) => {
  const db = getDB();
  const now = new Date();
  const w = parseInt(req.query.week) || getCurrentWeekOfMonth();
  const m = parseInt(req.query.month) || now.getMonth() + 1;
  const y = parseInt(req.query.year) || now.getFullYear();

  const totalRes = db.exec(
    `SELECT COALESCE(SUM(p.points), 0), COUNT(DISTINCT p.employee_id)
     FROM points p JOIN employees e ON p.employee_id = e.employee_id
     WHERE p.week=? AND p.month=? AND p.year=? AND e.active=1`, [w, m, y]
  );
  const cslRes = db.exec(
    `SELECT COALESCE(SUM(p.points), 0) FROM points p
     JOIN employees e ON p.employee_id = e.employee_id
     WHERE p.week=? AND p.month=? AND p.year=? AND e.active=1 AND e.category='CSL'`, [w, m, y]
  );
  const xdssRes = db.exec(
    `SELECT COALESCE(SUM(p.points), 0) FROM points p
     JOIN employees e ON p.employee_id = e.employee_id
     WHERE p.week=? AND p.month=? AND p.year=? AND e.active=1 AND e.category='XDSS'`, [w, m, y]
  );
  const jdssRes = db.exec(
    `SELECT COALESCE(SUM(p.points), 0) FROM points p
     JOIN employees e ON p.employee_id = e.employee_id
     WHERE p.week=? AND p.month=? AND p.year=? AND e.active=1 AND e.category='JDSS'`, [w, m, y]
  );
  const topRes = db.exec(
    `SELECT e.name, e.category, p.points
     FROM points p JOIN employees e ON p.employee_id = e.employee_id
     WHERE p.week=? AND p.month=? AND p.year=? AND e.active=1
     ORDER BY p.points DESC LIMIT 1`, [w, m, y]
  );

  res.json({
    total: totalRes[0]?.values[0][0] || 0,
    activeEmployees: totalRes[0]?.values[0][1] || 0,
    csl: cslRes[0]?.values[0][0] || 0,
    xdss: xdssRes[0]?.values[0][0] || 0,
    jdss: jdssRes[0]?.values[0][0] || 0,
    topPerformer: topRes[0]?.values[0]
      ? { name: topRes[0].values[0][0], category: topRes[0].values[0][1], points: topRes[0].values[0][2] }
      : null,
    week: w, month: m, year: y
  });
});

// GET /api/admin/employees
router.get('/employees', adminAuth, (req, res) => {
  const { search = '', page = 1, limit = 20, category = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDB();
  const now = new Date();
  const currentWeek = getCurrentWeekOfMonth();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let whereClauses = ['e.active = 1'];
  let params = [];

  if (search) {
    whereClauses.push("(e.name LIKE ? OR e.employee_id LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    whereClauses.push("e.category = ?");
    params.push(category);
  }

  const where = whereClauses.join(' AND ');
  const countResult = db.exec(`SELECT COUNT(*) FROM employees e WHERE ${where}`, params);
  const total = countResult[0].values[0][0];

  const dataResult = db.exec(
    `SELECT e.id, e.employee_id, e.name, e.category, e.region, e.state,
            COALESCE(p.points, 0) as points, e.created_at
     FROM employees e
     LEFT JOIN points p ON e.employee_id = p.employee_id
       AND p.week = ? AND p.month = ? AND p.year = ?
     WHERE ${where}
     ORDER BY points DESC
     LIMIT ? OFFSET ?`,
    [currentWeek, currentMonth, currentYear, ...params, parseInt(limit), offset]
  );

  const employees = dataResult.length ? dataResult[0].values.map(row => ({
    id: row[0], employee_id: row[1], name: row[2],
    category: row[3], region: row[4], state: row[5],
    points: row[6], created_at: row[7]
  })) : [];

  res.json({ employees, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/admin/employees/:empId
router.get('/employees/:empId', adminAuth, (req, res) => {
  const db = getDB();
  const now = new Date();
  const currentWeek = getCurrentWeekOfMonth();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const result = db.exec(
    `SELECT e.id, e.employee_id, e.name, e.category, e.region, e.state, e.active, e.created_at,
            COALESCE(p.points, 0) as current_points
     FROM employees e
     LEFT JOIN points p ON e.employee_id = p.employee_id
       AND p.week = ? AND p.month = ? AND p.year = ?
     WHERE e.employee_id = ?`,
    [currentWeek, currentMonth, currentYear, req.params.empId]
  );
  if (!result.length || !result[0].values.length)
    return res.status(404).json({ error: 'Employee not found' });

  const r = result[0].values[0];
  res.json({
    id: r[0], employee_id: r[1], name: r[2], category: r[3],
    region: r[4], state: r[5], active: r[6], created_at: r[7], points: r[8]
  });
});

// POST /api/admin/employees
router.post('/employees', adminAuth, (req, res) => {
  const { employee_id, name, category, region, state, password } = req.body;
  if (!employee_id || !name || !category || !region || !state || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (!['CSL', 'XDSS', 'JDSS'].includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  const db = getDB();
  const exists = db.exec("SELECT id FROM employees WHERE employee_id = ?", [employee_id]);
  if (exists.length && exists[0].values.length)
    return res.status(400).json({ error: 'Employee ID already exists' });

  const hash = bcrypt.hashSync(password, 10);
  db.run(
    "INSERT INTO employees (employee_id, name, category, region, state, password_hash) VALUES (?,?,?,?,?,?)",
    [employee_id, name, category, region, state, hash]
  );
  saveDB();
  res.status(201).json({ message: 'Employee created successfully' });
});

// PUT /api/admin/employees/:empId
router.put('/employees/:empId', adminAuth, (req, res) => {
  const { name, category, region, state, active, password } = req.body;
  const db = getDB();

  const exists = db.exec("SELECT id FROM employees WHERE employee_id = ?", [req.params.empId]);
  if (!exists.length || !exists[0].values.length)
    return res.status(404).json({ error: 'Employee not found' });

  if (name) db.run("UPDATE employees SET name=? WHERE employee_id=?", [name, req.params.empId]);
  if (category) db.run("UPDATE employees SET category=? WHERE employee_id=?", [category, req.params.empId]);
  if (region) db.run("UPDATE employees SET region=? WHERE employee_id=?", [region, req.params.empId]);
  if (state) db.run("UPDATE employees SET state=? WHERE employee_id=?", [state, req.params.empId]);
  if (active !== undefined) db.run("UPDATE employees SET active=? WHERE employee_id=?", [active ? 1 : 0, req.params.empId]);
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.run("UPDATE employees SET password_hash=? WHERE employee_id=?", [hash, req.params.empId]);
  }

  saveDB();
  res.json({ message: 'Employee updated' });
});

// DELETE /api/admin/employees/:empId
router.delete('/employees/:empId', adminAuth, (req, res) => {
  const db = getDB();
  db.run("UPDATE employees SET active=0 WHERE employee_id=?", [req.params.empId]);
  saveDB();
  res.json({ message: 'Employee deactivated' });
});

// PUT /api/admin/points
router.put('/points', adminAuth, (req, res) => {
  const { employee_id, points, week, month, year } = req.body;
  if (!employee_id || points === undefined)
    return res.status(400).json({ error: 'employee_id and points required' });

  const db = getDB();
  const now = new Date();
  const w = week || getCurrentWeekOfMonth();
  const m = month || (now.getMonth() + 1);
  const y = year || now.getFullYear();

  db.run(
    `INSERT INTO points (employee_id, points, week, month, year)
     VALUES (?,?,?,?,?)
     ON CONFLICT(employee_id, week, year) DO UPDATE SET points=excluded.points, updated_at=CURRENT_TIMESTAMP`,
    [employee_id, points, w, m, y]
  );
  saveDB();
  res.json({ message: 'Points updated' });
});

// GET /api/admin/rankings
router.get('/rankings', adminAuth, (req, res) => {
  const { scope = 'national', category, region, state, week, month, year, mode = 'week' } = req.query;
  const db = getDB();
  const now = new Date();
  const w = parseInt(week) || getCurrentWeekOfMonth();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();

  let whereClauses = ['e.active = 1'];
  let params = [];

  if (mode === 'month') {
    // Monthly: sum all weeks for that month
    whereClauses.push('p.month = ?', 'p.year = ?');
    params = [m, y];
  } else {
    // Weekly
    whereClauses.push('p.week = ?', 'p.month = ?', 'p.year = ?');
    params = [w, m, y];
  }

  if (category) { whereClauses.push('e.category = ?'); params.push(category); }
  if (scope === 'regional' && region) { whereClauses.push('e.region = ?'); params.push(region); }
  if (scope === 'state' && state) { whereClauses.push('e.state = ?'); params.push(state); }

  const where = whereClauses.join(' AND ');

  let query;
  if (mode === 'month') {
    query = `SELECT e.employee_id, e.name, e.category, e.region, e.state,
              SUM(p.points) as total_points,
              ROW_NUMBER() OVER (ORDER BY SUM(p.points) DESC) as rank
             FROM employees e
             JOIN points p ON e.employee_id = p.employee_id
             WHERE ${where}
             GROUP BY e.employee_id
             ORDER BY total_points DESC
             LIMIT 10`;
  } else {
    query = `SELECT e.employee_id, e.name, e.category, e.region, e.state,
              p.points,
              ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank
             FROM employees e
             JOIN points p ON e.employee_id = p.employee_id
             WHERE ${where}
             ORDER BY p.points DESC
             LIMIT 10`;
  }

  const result = db.exec(query, params);
  const rankings = result.length ? result[0].values.map(r => ({
    employee_id: r[0], name: r[1], category: r[2],
    region: r[3], state: r[4], points: r[5], rank: r[6]
  })) : [];

  res.json({ rankings, scope, week: w, month: m, year: y });
});

// POST /api/admin/change-password
router.post('/change-password', adminAuth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'current_password and new_password required' });
  if (new_password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const db = getDB();
  const result = db.exec("SELECT password_hash FROM admins WHERE id=?", [req.admin.id]);
  if (!result.length || !result[0].values.length)
    return res.status(404).json({ error: 'Admin not found' });

  if (!bcrypt.compareSync(current_password, result[0].values[0][0]))
    return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = bcrypt.hashSync(new_password, 10);
  db.run("UPDATE admins SET password_hash=? WHERE id=?", [hash, req.admin.id]);
  saveDB();
  res.json({ message: 'Password changed successfully' });
});

// POST /api/admin/reset-employee-password
router.post('/reset-employee-password', adminAuth, (req, res) => {
  const { employee_id, new_password } = req.body;
  if (!employee_id || !new_password)
    return res.status(400).json({ error: 'employee_id and new_password required' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDB();
  const exists = db.exec("SELECT id FROM employees WHERE employee_id=? AND active=1", [employee_id]);
  if (!exists.length || !exists[0].values.length)
    return res.status(404).json({ error: 'Employee not found' });

  const hash = bcrypt.hashSync(new_password, 10);
  db.run("UPDATE employees SET password_hash=?, must_change_password=1 WHERE employee_id=?", [hash, employee_id]);
  saveDB();
  res.json({ message: `Password reset for ${employee_id}` });
});

// POST /api/admin/bulk-points
router.post('/bulk-points', adminAuth, (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates))
    return res.status(400).json({ error: 'updates must be an array' });

  const db = getDB();
  const now = new Date();
  const week = getCurrentWeekOfMonth();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let success = 0, failed = [];

  updates.forEach(({ employee_id, points }) => {
    const exists = db.exec("SELECT id FROM employees WHERE employee_id=? AND active=1", [employee_id]);
    if (!exists.length || !exists[0].values.length) { failed.push(employee_id); return; }
    db.run(
      `INSERT INTO points (employee_id, points, week, month, year)
       VALUES (?,?,?,?,?)
       ON CONFLICT(employee_id, week, year) DO UPDATE SET points=excluded.points, updated_at=CURRENT_TIMESTAMP`,
      [employee_id, points, week, month, year]
    );
    success++;
  });

  saveDB();
  res.json({ success, failed, total: updates.length });
});

export default router;