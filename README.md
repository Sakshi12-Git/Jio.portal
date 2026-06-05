# Jio Performance Portal — Tez-Tarakki Stars

A full-stack employee leaderboard & ranking portal for Jio field teams.

---

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | React 18 + Vite + React Router |
| Backend  | Node.js + Express           |
| Database | SQLite (via sql.js — zero native deps) |
| Auth     | JWT (jsonwebtoken)          |
| Styling  | Pure CSS (no framework)     |

---

## Project Structure

```
jio-portal/
├── backend/
│   ├── server.js          ← Express entry point
│   ├── db.js              ← SQLite init + seeding
│   ├── middleware.js       ← JWT auth middleware
│   └── routes/
│       ├── admin.js        ← All admin API routes
│       └── employee.js     ← Employee login + rankings
├── frontend/
│   ├── src/
│   │   ├── App.jsx         ← Routes & auth guards
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Employees.jsx
│   │   │       ├── Rankings.jsx
│   │   │       ├── Points.jsx
│   │   │       └── Settings.jsx
│   │   ├── components/
│   │   │   └── AdminLayout.jsx  ← Sidebar + mobile topbar
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx
│   │   │   └── useToast.jsx
│   │   └── utils/
│   │       └── api.js      ← Axios instance
│   └── index.html
└── README.md
```

---

## Setup & Run

### Prerequisites
- Node.js v18+ installed
- npm v9+

### Step 1 — Install dependencies

```bash
# From project root
cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Start the backend

```bash
cd backend
node server.js
```

You'll see:
```
✅ Database ready
🚀 Jio Portal API running at http://localhost:4000
```

The SQLite database file `portal.db` is created automatically on first run with 50 sample employees.

### Step 3 — Start the frontend (new terminal)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Default Login Credentials

### Admin accounts (max 3 simultaneous sessions)

| Username | Password   |
|----------|------------|
| admin1   | Admin@123  |
| admin2   | Admin@456  |
| admin3   | Admin@789  |

### Employee accounts (50 sample employees)

- Employee IDs: `JIO-01000` through `JIO-01049`
- Password for all: `Pass@123`

---

## Admin Panel Features

### Dashboard
- Live stats: total employees, by category (CSL / XDSS / JDSS), active admin sessions
- National top-5 rankings preview
- Campaign name + tagline display
- Quick links

### Employees Page (`/admin/employees`)
- Full paginated table (15 per page) — handles 6,000+ employees
- Search by name or employee ID (live)
- Filter by category (CSL / XDSS / JDSS)
- Add new employee (modal form)
- Edit employee details and password
- Deactivate employee (soft delete)

### Rankings Page (`/admin/rankings`)
- Switch between National / Regional / State scope
- Filter by category
- Filter by region (for Regional scope)
- Filter by region + state (for State scope)
- Top 10 leaderboard with gold/silver/bronze medals
- Real-time from database

### Points Page (`/admin/points`)
- Single employee point update
- Bulk CSV update — paste `employee_id, points` per line
- Shows success/failure counts for bulk
- Points are week-scoped (ISO week)

### Settings Page (`/admin/settings`)
- Edit campaign name (shown on login page)
- Edit tagline (shown on employee dashboard)
- Live preview panel
- Saves to database immediately

---

## API Endpoints

### Public
```
GET  /api/health
GET  /api/employee/settings
POST /api/employee/login
```

### Employee (requires employee JWT)
```
GET /api/employee/rankings/national
GET /api/employee/rankings/regional
GET /api/employee/rankings/state
```

### Admin (requires admin JWT)
```
POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/stats
GET  /api/admin/settings
PUT  /api/admin/settings
GET  /api/admin/employees
GET  /api/admin/employees/:empId
POST /api/admin/employees
PUT  /api/admin/employees/:empId
DEL  /api/admin/employees/:empId
PUT  /api/admin/points
POST /api/admin/bulk-points
GET  /api/admin/rankings
```

---

## Security Notes

- JWT tokens expire in 8 hours (admin) / 12 hours (employee)
- Max 3 admin sessions enforced server-side
- Passwords hashed with bcrypt (salt rounds: 10)
- Employees can only see rankings for their own category (CSL vs XDSS/JDSS)
- Soft-deleted employees cannot log in

---

## Deployment (When Ready)

### Option A — Same server
1. Run `cd frontend && npm run build` — creates `dist/`
2. Serve `dist/` as static files from Express
3. Deploy the backend to any Node.js host (Railway, Render, VPS)

### Option B — Separate hosting
- Frontend → Vercel / Netlify (point `VITE_API_URL` env to backend URL)
- Backend → Railway / Render / any VPS

### Environment Variables (backend)
```
PORT=4000
JWT_SECRET=your-secure-random-secret-here
FRONTEND_URL=http://your-frontend-url.com
```

---

## Next Steps (Employee-Facing Pages)

The employee leaderboard pages (`/dashboard`) are scaffolded and ready.  
The backend APIs for `/api/employee/rankings/*` are fully built.  
Frontend pages need to be built for:
- Employee dashboard with ranking selection
- National / Regional / State leaderboard views
- Mobile-first screenshot-friendly layout per spec

---

## Database Schema

```sql
settings      (key, value)
admins        (id, username, password_hash, name, created_at)
employees     (id, employee_id, name, category, region, state, password_hash, active, created_at)
points        (id, employee_id, points, week, month, year, updated_at)
              UNIQUE(employee_id, week, year)
admin_sessions (id, admin_id, token, created_at)
```
