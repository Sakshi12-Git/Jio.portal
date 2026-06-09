import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '../db.js';
import { employeeAuth, JWT_SECRET } from '../middleware.js';

const router = express.Router();

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekDateRange(weekOfMonth, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const starts = [1, 8, 15, 22];
  const ends = [7, 14, 21, daysInMonth];
  const start = starts[weekOfMonth - 1];
  const end = ends[weekOfMonth - 1];
  return `${start}–${end} ${MONTH_SHORT[month - 1]}`;
}

function getCurrentWeekOfMonth() {
  const now = new Date();
  const day = now.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

// POST /api/employee/login
router.post('/login', (req, res) => {
  const { employee_id, password } = req.body;
  if (!employee_id || !password)
    return res.status(400).json({ error: 'Employee ID and password required' });

  const db = getDB();
  const result = db.exec(
    "SELECT id, employee_id, name, category, region, state, password_hash, must_change_password FROM employees WHERE employee_id=? AND active=1",
    [employee_id]
  );

  if (!result.length || !result[0].values.length)
    return res.status(401).json({ error: 'Invalid credentials' });

  const [id, eid, name, category, region, state, hash, mustChange] = result[0].values[0];
  if (!bcrypt.compareSync(password, hash))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id, employee_id: eid, name, category, region, state, role: 'employee' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: { id, employee_id: eid, name, category, region, state },
    must_change_password: mustChange === 1
  });
});

// POST /api/employee/change-password
router.post('/change-password', employeeAuth, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || !confirm_password)
    return res.status(400).json({ error: 'All fields are required' });
  if (new_password !== confirm_password)
    return res.status(400).json({ error: 'New passwords do not match' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  if (new_password === current_password)
    return res.status(400).json({ error: 'New password must be different from current password' });

  const db = getDB();
  const result = db.exec("SELECT password_hash FROM employees WHERE employee_id=? AND active=1", [req.user.employee_id]);
  if (!result.length || !result[0].values.length)
    return res.status(404).json({ error: 'Employee not found' });

  const hash = result[0].values[0][0];
  if (!bcrypt.compareSync(current_password, hash))
    return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = bcrypt.hashSync(new_password, 10);
  db.run("UPDATE employees SET password_hash=?, must_change_password=0 WHERE employee_id=?", [newHash, req.user.employee_id]);
  saveDB();
  res.json({ message: 'Password changed successfully' });
});

// GET /api/employee/settings
router.get('/settings', (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT key, value FROM settings");
  const settings = {};
  if (result.length) result[0].values.forEach(([k, v]) => { settings[k] = v; });
  res.json(settings);
});

// GET /api/employee/week-options?month=6&year=2026
router.get('/week-options', employeeAuth, (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();
  const currentWeekOfMonth = getCurrentWeekOfMonth();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const weeks = [1, 2, 3, 4].map(w => ({
    week: w,
    label: getWeekDateRange(w, month, year),
    // Only show weeks that have passed or are current
    available: (year < currentYear) ||
               (year === currentYear && month < currentMonth) ||
               (year === currentYear && month === currentMonth && w <= currentWeekOfMonth)
  })).filter(w => w.available);

  res.json({ weeks, month, year });
});

// Shared rankings logic
function getRankings(db, scope, catFilter, w, m, y, region, state, mode) {
  let scopeFilter = '';
  let params = [];

  if (mode === 'week') {
    // Weekly: filter by week_of_month (stored as week) and month+year
    params = [w, m, y];
    const weekFilter = 'AND p.week=? AND p.month=? AND p.year=?';
    if (scope === 'regional') scopeFilter = `AND e.region=?`;
    if (scope === 'state') scopeFilter = `AND e.state=?`;
    const scopeParam = scope === 'regional' ? region : scope === 'state' ? state : null;
    const allParams = scopeParam ? [...params, scopeParam] : params;

    const result = db.exec(
      `SELECT e.employee_id, e.name, e.category, e.region, e.state, p.points,
              ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank
       FROM employees e
       JOIN points p ON e.employee_id = p.employee_id
       WHERE e.active=1 ${weekFilter} ${catFilter} ${scopeFilter}
       ORDER BY p.points DESC LIMIT 10`,
      allParams
    );
    return result.length ? result[0].values.map(r => ({
      employee_id: r[0], name: r[1], category: r[2], region: r[3], state: r[4], points: r[5], rank: r[6]
    })) : [];
  } else {
    // Monthly: SUM all weeks for that month+year
    params = [m, y];
    if (scope === 'regional') scopeFilter = `AND e.region=?`;
    if (scope === 'state') scopeFilter = `AND e.state=?`;
    const scopeParam = scope === 'regional' ? region : scope === 'state' ? state : null;
    const allParams = scopeParam ? [...params, scopeParam] : params;

    const result = db.exec(
      `SELECT e.employee_id, e.name, e.category, e.region, e.state,
              SUM(p.points) as total_points,
              ROW_NUMBER() OVER (ORDER BY SUM(p.points) DESC) as rank
       FROM employees e
       JOIN points p ON e.employee_id = p.employee_id
       WHERE e.active=1 AND p.month=? AND p.year=? ${catFilter} ${scopeFilter}
       GROUP BY e.employee_id
       ORDER BY total_points DESC LIMIT 10`,
      allParams
    );
    return result.length ? result[0].values.map(r => ({
      employee_id: r[0], name: r[1], category: r[2], region: r[3], state: r[4], points: r[5], rank: r[6]
    })) : [];
  }
}

function getUserRankData(db, employeeId, w, m, y, scope, catFilter, mode, region, state) {
  let scopeFilter = '';
  let params = [];

  if (mode === 'week') {
    params = [w, m, y];
    if (scope === 'regional' && region) { scopeFilter = 'AND e.region=?'; params.push(region); }
    if (scope === 'state' && state) { scopeFilter = 'AND e.state=?'; params.push(state); }

    const result = db.exec(
      `WITH ranked AS (
        SELECT e.employee_id, p.points,
               ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank,
               COUNT(*) OVER () as total
        FROM employees e
        JOIN points p ON e.employee_id = p.employee_id
        WHERE e.active=1 AND p.week=? AND p.month=? AND p.year=? ${catFilter} ${scopeFilter}
      )
      SELECT rank, points, total FROM ranked WHERE employee_id=?`,
      [...params, employeeId]
    );
    if (!result.length || !result[0].values.length) return { rank: null, points: 0, total: 0, percentile: null };
    const [rank, points, total] = result[0].values[0];
    return { rank, points, total, percentile: Math.round(((total - rank) / total) * 100) };
  } else {
    params = [m, y];
    if (scope === 'regional' && region) { scopeFilter = 'AND e.region=?'; params.push(region); }
    if (scope === 'state' && state) { scopeFilter = 'AND e.state=?'; params.push(state); }

    const result = db.exec(
      `WITH ranked AS (
        SELECT e.employee_id, SUM(p.points) as points,
               ROW_NUMBER() OVER (ORDER BY SUM(p.points) DESC) as rank,
               COUNT(DISTINCT e.employee_id) OVER () as total
        FROM employees e
        JOIN points p ON e.employee_id = p.employee_id
        WHERE e.active=1 AND p.month=? AND p.year=? ${catFilter} ${scopeFilter}
        GROUP BY e.employee_id
      )
      SELECT rank, points, total FROM ranked WHERE employee_id=?`,
      [...params, employeeId]
    );
    if (!result.length || !result[0].values.length) return { rank: null, points: 0, total: 0, percentile: null };
    const [rank, points, total] = result[0].values[0];
    return { rank, points, total, percentile: Math.round(((total - rank) / total) * 100) };
  }
}

// GET /api/employee/rankings/:scope
// Params: mode=week|month, week=1-4, month=6, year=2026
router.get('/rankings/:scope', employeeAuth, (req, res) => {
  const { scope } = req.params;
  const { mode = 'week', week, month, year } = req.query;
  const db = getDB();
  const now = new Date();

  const w = parseInt(week) || getCurrentWeekOfMonth();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();

  const catFilter = req.user.category === 'CSL'
    ? "AND e.category = 'CSL'"
    : "AND e.category IN ('XDSS','JDSS')";

  const region = req.user.region;
  const state = req.user.state;

  const rankings = getRankings(db, scope, catFilter, w, m, y, region, state, mode);
  const myRank = getUserRankData(db, req.user.employee_id, w, m, y, scope, catFilter, mode, region, state);

  // Build period label
  const weekLabel = mode === 'week' ? getWeekDateRange(w, m, y) : null;
  const monthLabel = MONTH_NAMES[m - 1] + ' ' + y;

  res.json({
    rankings, myRank, scope,
    mode, week: w, month: m, year: y,
    weekLabel, monthLabel
  });
});

export default router;