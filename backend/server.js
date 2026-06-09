import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { initDB } from './db.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import excelRoutes from './routes/excel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Serve uploaded files (logo, etc.)
const uploadsDir = path.join(__dirname, 'uploads');
mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/excel', excelRoutes);

// Serve frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Jio Portal API running at http://localhost:${PORT}\n`);
  });
}).catch(err => { console.error('Failed to init DB:', err); process.exit(1); });