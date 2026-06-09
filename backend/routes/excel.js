import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { getDB, saveDB } from '../db.js';
import { adminAuth } from '../middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function dayToWeekOfMonth(day) {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export function getWeekDateRange(weekOfMonth, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const starts = [1, 8, 15, 22];
  const ends = [7, 14, 21, daysInMonth];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${starts[weekOfMonth-1]}–${ends[weekOfMonth-1]} ${monthNames[month-1]}`;
}

// GET /api/excel/template
router.get('/template', adminAuth, (req, res) => {
  const wb = XLSX.utils.book_new();

  const empData = [
    ['Employee ID', 'Name', 'Position', 'Country', 'Region', 'State', 'Mobile', 'Active'],
    ['1234567', 'Arjun Sharma', 'CSL', 'India', 'North', 'Delhi', '9876512345', 'YES'],
    ['7654321', 'Priya Mehta', 'XDSS', 'India', 'South', 'Tamil Nadu', '9123456789', 'YES'],
    ['9876543', 'Ravi Kumar', 'JDSS', 'India', 'West', 'Mumbai', '8765432100', 'YES'],
  ];
  const empSheet = XLSX.utils.aoa_to_sheet(empData);
  empSheet['!cols'] = [{ wch:14 },{ wch:22 },{ wch:10 },{ wch:10 },{ wch:12 },{ wch:16 },{ wch:14 },{ wch:8 }];
  XLSX.utils.book_append_sheet(wb, empSheet, 'Employees');

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const todayStr = `${dd}-${mm}-${yyyy}`;

  const instData = [
    ['Employee ID', 'Installations', 'Date'],
    ['1234567', 5, todayStr],
    ['7654321', 3, todayStr],
    ['9876543', 7, todayStr],
  ];
  const instSheet = XLSX.utils.aoa_to_sheet(instData);
  instSheet['!cols'] = [{ wch:14 },{ wch:15 },{ wch:14 }];
  XLSX.utils.book_append_sheet(wb, instSheet, 'Installations');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="jio-portal-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// POST /api/excel/preview
router.post('/preview', adminAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const result = parseExcel(wb);
    res.json({ ...result, preview: true });
  } catch (e) {
    res.status(400).json({ error: 'Invalid Excel file: ' + e.message });
  }
});

// POST /api/excel/import — ACCUMULATES daily installations
router.post('/import', adminAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const { employees, installations, errors } = parseExcel(wb);
    const db = getDB();

    try { db.run("ALTER TABLE employees ADD COLUMN mobile TEXT DEFAULT ''"); } catch {}

    let empAdded = 0, empUpdated = 0, instUpdated = 0;
    const newPasswords = [];

    // Process employees
    for (const emp of employees) {
      const exists = db.exec("SELECT id FROM employees WHERE employee_id = ?", [emp.employee_id]);
      const mobile = String(emp.mobile || '').replace(/\D/g, '');
      const pwd = mobile.length >= 5 ? 'EP@' + mobile.slice(-5) : 'EP@' + emp.employee_id.toString().slice(-5);

      if (!exists.length || !exists[0].values.length) {
        const hash = bcrypt.hashSync(pwd, 10);
        db.run(
          `INSERT INTO employees (employee_id, name, category, country, region, state, mobile, password_hash, active, must_change_password) VALUES (?,?,?,?,?,?,?,?,?,0)`,
          [emp.employee_id, emp.name, emp.category, emp.country || 'India', emp.region, emp.state, mobile, hash, emp.active ? 1 : 0]
        );
        newPasswords.push({ employee_id: emp.employee_id, name: emp.name, mobile: mobile ? mobile.slice(0,5)+'*****' : '—', password: pwd });
        empAdded++;
      } else {
        db.run(
          `UPDATE employees SET name=?, category=?, country=?, region=?, state=?, active=? WHERE employee_id=?`,
          [emp.name, emp.category, emp.country || 'India', emp.region, emp.state, emp.active ? 1 : 0, emp.employee_id]
        );
        if (mobile) {
          const hash = bcrypt.hashSync(pwd, 10);
          db.run("UPDATE employees SET mobile=?, password_hash=? WHERE employee_id=?", [mobile, hash, emp.employee_id]);
        }
        empUpdated++;
      }
    }

    // Process installations — ADD to existing (daily accumulation)
    for (const inst of installations) {
      const empCheck = db.exec("SELECT id FROM employees WHERE employee_id=?", [inst.employee_id]);
      if (!empCheck.length || !empCheck[0].values.length) continue;

      db.run(
        `INSERT INTO points (employee_id, points, week, month, year) VALUES (?,?,?,?,?)
         ON CONFLICT(employee_id, week, year) DO UPDATE SET
           points = points + excluded.points,
           updated_at = CURRENT_TIMESTAMP`,
        [inst.employee_id, inst.installations, inst.week_of_month, inst.month, inst.year]
      );
      instUpdated++;
    }

    saveDB();
    res.json({ success: true, empAdded, empUpdated, instUpdated, newPasswords, errors });
  } catch (e) {
    res.status(400).json({ error: 'Import failed: ' + e.message });
  }
});

// POST /api/excel/clear-installations
router.post('/clear-installations', adminAuth, (req, res) => {
  const db = getDB();
  db.run("DELETE FROM points");
  saveDB();
  res.json({ message: 'All installation data cleared' });
});

// POST /api/excel/clear-all
router.post('/clear-all', adminAuth, (req, res) => {
  const db = getDB();
  db.run("DELETE FROM points");
  db.run("DELETE FROM employees");
  saveDB();
  res.json({ message: 'All data cleared' });
});

function parseExcel(wb) {
  const errors = [];
  const employees = [];
  const installations = [];

  if (wb.SheetNames.includes('Employees')) {
    const sheet = wb.Sheets['Employees'];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rows.forEach((row, i) => {
      const empId = String(row['Employee ID'] || row['employee_id'] || '').trim();
      const name = String(row['Name'] || row['name'] || '').trim();
      const category = String(row['Position'] || row['Category'] || row['position'] || row['category'] || '').trim().toUpperCase();
      const region = String(row['Region'] || row['region'] || '').trim();
      const state = String(row['State'] || row['state'] || '').trim();
      const country = String(row['Country'] || row['country'] || 'India').trim();
      const mobile = String(row['Mobile'] || row['mobile'] || '').trim().replace(/\D/g, '');
      const activeRaw = String(row['Active'] || row['active'] || 'YES').trim().toUpperCase();
      const active = activeRaw === 'YES' || activeRaw === '1' || activeRaw === 'TRUE';
      if (!empId || !name) { errors.push(`Row ${i+2}: Missing ID or Name`); return; }
      if (!['CSL','XDSS','JDSS'].includes(category)) { errors.push(`Row ${i+2}: Invalid Position "${category}"`); return; }
      employees.push({ employee_id: empId, name, category, country, region, state, mobile, active });
    });
  }

  if (wb.SheetNames.includes('Installations')) {
    const sheet = wb.Sheets['Installations'];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rows.forEach((row, i) => {
      const empId = String(row['Employee ID'] || row['employee_id'] || '').trim();
      const inst = parseInt(row['Installations'] || row['installations'] || 0);

      let week_of_month, month, year;

      const dateRaw = String(row['Date'] || row['date'] || '').trim();
      if (dateRaw) {
        const parts = dateRaw.split(/[-\/]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          month = parseInt(parts[1]);
          year = parseInt(parts[2]);
          week_of_month = dayToWeekOfMonth(day);
        }
      }

      if (!week_of_month) {
        month = parseInt(row['Month'] || row['month'] || new Date().getMonth() + 1);
        year = parseInt(row['Year'] || row['year'] || new Date().getFullYear());
        const oldWeek = parseInt(row['Week'] || row['week'] || 1);
        week_of_month = ((oldWeek - 1) % 4) + 1;
      }

      if (!empId) { errors.push(`Installations row ${i+2}: Missing Employee ID`); return; }
      if (!month || !year) { errors.push(`Installations row ${i+2}: Invalid date`); return; }
      if (inst <= 0) return; // Skip zero installations
      installations.push({ employee_id: empId, installations: inst, week_of_month, month, year });
    });
  }

  return { employees, installations, errors };
}

export default router;