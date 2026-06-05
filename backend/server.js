import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import excelRoutes from './routes/excel.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/excel', excelRoutes);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Jio Portal API running at http://localhost:${PORT}`);
    console.log(`📦 Admin accounts: admin1/Admin@123 | admin2/Admin@456 | admin3/Admin@789\n`);
  });
}).catch(err => { console.error('Failed to init DB:', err); process.exit(1); });