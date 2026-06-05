import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '../db.js';
import { employeeAuth, JWT_SECRET } from '../middleware.js';

const router = express.Router();

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
  const result = db.exec(
    "SELECT password_hash FROM employees WHERE employee_id=? AND active=1",
    [req.user.employee_id]
  );

  if (!result.length || !result[0].values.length)
    return res.status(404).json({ error: 'Employee not found' });

  const hash = result[0].values[0][0];
  if (!bcrypt.compareSync(current_password, hash))
    return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = bcrypt.hashSync(new_password, 10);
  db.run(
    "UPDATE employees SET password_hash=?, must_change_password=0 WHERE employee_id=?",
    [newHash, req.user.employee_id]
  );
  saveDB();

  res.json({ message: 'Password changed successfully' });
});

// GET /api/employee/settings (public — for login page campaign name)
router.get('/settings', (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT key, value FROM settings");
  const settings = {};
  if (result.length) result[0].values.forEach(([k, v]) => { settings[k] = v; });
  res.json(settings);
});

// GET /api/employee/rankings/national
router.get('/rankings/national', employeeAuth, (req, res) => {
  const { week, year } = req.query;
  const db = getDB();
  const now = new Date();
  const w = parseInt(week) || getWeekNumber(now);
  const y = parseInt(year) || now.getFullYear();

  const catFilter = req.user.category === 'CSL'
    ? "AND e.category = 'CSL'"
    : "AND e.category IN ('XDSS','JDSS')";

  const result = db.exec(
    `SELECT e.employee_id, e.name, e.category, e.region, e.state, p.points,
            ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank
     FROM employees e
     JOIN points p ON e.employee_id = p.employee_id
     WHERE e.active=1 AND p.week=? AND p.year=? ${catFilter}
     ORDER BY p.points DESC
     LIMIT 10`,
    [w, y]
  );

  const rankings = result.length ? result[0].values.map(r => ({
    employee_id: r[0], name: r[1], category: r[2], region: r[3], state: r[4], points: r[5], rank: r[6]
  })) : [];

  const myRank = getUserRank(db, req.user.employee_id, w, y, 'national', catFilter);
  res.json({ rankings, myRank, scope: 'national', week: w, year: y });
});

// GET /api/employee/rankings/regional
router.get('/rankings/regional', employeeAuth, (req, res) => {
  const { week, year } = req.query;
  const db = getDB();
  const now = new Date();
  const w = parseInt(week) || getWeekNumber(now);
  const y = parseInt(year) || now.getFullYear();
  const userRegion = req.user.region;

  const catFilter = req.user.category === 'CSL'
    ? "AND e.category = 'CSL'"
    : "AND e.category IN ('XDSS','JDSS')";

  const result = db.exec(
    `SELECT e.employee_id, e.name, e.category, e.region, e.state, p.points,
            ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank
     FROM employees e
     JOIN points p ON e.employee_id = p.employee_id
     WHERE e.active=1 AND p.week=? AND p.year=? AND e.region=? ${catFilter}
     ORDER BY p.points DESC
     LIMIT 10`,
    [w, y, userRegion]
  );

  const rankings = result.length ? result[0].values.map(r => ({
    employee_id: r[0], name: r[1], category: r[2], region: r[3], state: r[4], points: r[5], rank: r[6]
  })) : [];

  const myRank = getUserRank(db, req.user.employee_id, w, y, 'regional', catFilter, userRegion);
  res.json({ rankings, myRank, scope: 'regional', region: userRegion, week: w, year: y });
});

// GET /api/employee/rankings/state
router.get('/rankings/state', employeeAuth, (req, res) => {
  const { week, year } = req.query;
  const db = getDB();
  const now = new Date();
  const w = parseInt(week) || getWeekNumber(now);
  const y = parseInt(year) || now.getFullYear();
  const userState = req.user.state;

  const catFilter = req.user.category === 'CSL'
    ? "AND e.category = 'CSL'"
    : "AND e.category IN ('XDSS','JDSS')";

  const result = db.exec(
    `SELECT e.employee_id, e.name, e.category, e.region, e.state, p.points,
            ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank
     FROM employees e
     JOIN points p ON e.employee_id = p.employee_id
     WHERE e.active=1 AND p.week=? AND p.year=? AND e.state=? ${catFilter}
     ORDER BY p.points DESC
     LIMIT 10`,
    [w, y, userState]
  );

  const rankings = result.length ? result[0].values.map(r => ({
    employee_id: r[0], name: r[1], category: r[2], region: r[3], state: r[4], points: r[5], rank: r[6]
  })) : [];

  const myRank = getUserRank(db, req.user.employee_id, w, y, 'state', catFilter, null, userState);
  res.json({ rankings, myRank, scope: 'state', state: userState, week: w, year: y });
});

function getUserRank(db, employeeId, week, year, scope, catFilter, region = null, state = null) {
  let scopeFilter = '';
  let params = [week, year];

  if (scope === 'regional' && region) { scopeFilter = 'AND e.region=?'; params.push(region); }
  if (scope === 'state' && state) { scopeFilter = 'AND e.state=?'; params.push(state); }

  const result = db.exec(
    `WITH ranked AS (
      SELECT e.employee_id, p.points,
             ROW_NUMBER() OVER (ORDER BY p.points DESC) as rank,
             COUNT(*) OVER () as total
      FROM employees e
      JOIN points p ON e.employee_id = p.employee_id
      WHERE e.active=1 AND p.week=? AND p.year=? ${catFilter} ${scopeFilter}
    )
    SELECT rank, points, total FROM ranked WHERE employee_id=?`,
    [...params, employeeId]
  );

  if (!result.length || !result[0].values.length)
    return { rank: null, points: 0, total: 0, percentile: null };

  const [rank, points, total] = result[0].values[0];
  const percentile = Math.round(((total - rank) / total) * 100);
  return { rank, points, total, percentile };
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export default router;