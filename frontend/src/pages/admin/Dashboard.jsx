import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: color + '18' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 22, color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function getCurrentWeekOfMonth() {
  const day = new Date().getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function getWeekDateRange(weekOfMonth, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const starts = [1, 8, 15, 22];
  const ends = [7, 14, 21, daysInMonth];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${starts[weekOfMonth-1]}–${ends[weekOfMonth-1]} ${monthNames[month-1]}`;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [instStats, setInstStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentWeek = getCurrentWeekOfMonth();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const weekLabel = getWeekDateRange(currentWeek, currentMonth, currentYear);
  const monthLabel = MONTH_NAMES[currentMonth - 1] + ' ' + currentYear;

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/settings'),
      api.get(`/admin/installation-stats?week=${currentWeek}&month=${currentMonth}&year=${currentYear}`).catch(() => ({ data: null })),
    ]).then(([s, set, inst]) => {
      setStats(s.data);
      setSettings(set.data);
      setInstStats(inst.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      Loading dashboard…
    </div>
  );

  const HOW_TO_USE = [
    {
      step: '1', icon: 'ti-file-spreadsheet', color: 'var(--jio-blue)',
      title: 'Upload Employee Data',
      desc: 'Go to Excel Upload → Download the template → Fill Employee IDs, Names, Category (CSL/XDSS/JDSS), Region, State, and Mobile number → Upload.'
    },
    {
      step: '2', icon: 'ti-lock', color: '#7C3AED',
      title: 'Share Login Credentials',
      desc: 'Passwords are auto-generated as EP@ + last 5 digits of mobile number. Share Employee ID and password with each employee.'
    },
    {
      step: '3', icon: 'ti-home-check', color: 'var(--success)',
      title: 'Upload Daily Installations',
      desc: 'Every day, download the template → fill Employee ID, installations count, and today\'s date (DD-MM-YYYY) → Upload. Daily counts add up automatically.'
    },
    {
      step: '4', icon: 'ti-trophy', color: 'var(--warning)',
      title: 'Track Rankings',
      desc: 'Go to Rankings to view National, Regional, and State leaderboards. Filter by category (CSL / XDSS+JDSS) and switch between weekly and monthly view.'
    },
    {
      step: '5', icon: 'ti-settings', color: 'var(--danger)',
      title: 'Manage Settings',
      desc: 'Update campaign name, tagline, and admin passwords from Settings. Reset any employee password from the Employees page.'
    },
  ];

  const instBreakdown = [
    { label: 'CSL',  value: instStats?.csl,  color: 'var(--jio-blue)', bg: 'var(--jio-blue-light)' },
    { label: 'XDSS', value: instStats?.xdss, color: 'var(--warning)',  bg: '#FFFBEB' },
    { label: 'JDSS', value: instStats?.jdss, color: 'var(--success)',  bg: '#F0FDF4' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1 style={{ fontSize: 26 }}>
          Welcome back, {user?.name}
        </h1>
        <p style={{ fontSize: 14, marginTop: 4 }}>
          {settings.campaign_name} &nbsp;·&nbsp; {weekLabel} &nbsp;·&nbsp; {monthLabel}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <KpiCard icon="ti-users"         label="Total Employees"        value={stats?.total?.toLocaleString() || '0'}           color="var(--jio-blue)" />
        <KpiCard icon="ti-id"            label="CSL Employees"          value={stats?.csl?.toLocaleString() || '0'}             color="var(--jio-teal)" />
        <KpiCard icon="ti-network"       label="XDSS Employees"         value={stats?.xdss?.toLocaleString() || '0'}            color="var(--warning)" />
        <KpiCard icon="ti-device-mobile" label="JDSS Employees"         value={stats?.jdss?.toLocaleString() || '0'}            color="var(--success)" />
        <KpiCard icon="ti-shield"        label="Active Admin Sessions"   value={`${stats?.adminsActive || 0} / ${stats?.maxAdmins || 3}`} color="var(--danger)" sub="Max 3 simultaneous" />
      </div>

      {/* Installations + Campaign side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }} className="dash-grid">

        {/* Installations this week */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16 }}>Installations This Week</h3>
              <p style={{ fontSize: 12, marginTop: 2 }}>{weekLabel} · {monthLabel}</p>
            </div>
            <span className="badge badge-blue">{weekLabel}</span>
          </div>

          {/* Big number */}
          <div style={{
            background: 'linear-gradient(135deg, var(--jio-blue-dark), var(--jio-blue))',
            borderRadius: 12,
            padding: '24px 20px',
            color: '#fff',
            textAlign: 'center',
            marginBottom: 16,
            boxShadow: '0 4px 16px rgba(15,60,201,0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Total Installations
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-1px' }}>
              {instStats?.total?.toLocaleString() || '0'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
              across {instStats?.activeEmployees || '0'} active employees
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {instBreakdown.map(c => (
              <div key={c.label} style={{
                background: c.bg,
                borderRadius: 10,
                padding: '14px 8px',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>
                  {c.value?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {instStats?.topPerformer && (
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>🥇</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{instStats.topPerformer.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {instStats.topPerformer.category} · Top performer this week
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--jio-blue)', flexShrink: 0 }}>
                {instStats.topPerformer.points}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>installs</span>
              </div>
            </div>
          )}
        </div>

        {/* Campaign settings + Quick links */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 18 }}>Campaign Settings</h3>

          <div style={{ marginBottom: 14 }}>
            <label>Campaign Name</label>
            <div style={{
              padding: '10px 14px',
              background: 'var(--border-light)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {settings.campaign_name}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Tagline</label>
            <div style={{
              padding: '10px 14px',
              background: 'var(--border-light)',
              borderRadius: 8,
              fontSize: 14,
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
            }}>
              {settings.tagline}
            </div>
          </div>

          <Link to="/admin/settings" className="btn btn-secondary btn-sm">
            <i className="ti ti-edit" /> Edit Campaign Settings
          </Link>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              Quick Links
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/admin/employees" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="ti ti-user-plus" /> Add / Manage Employees
              </Link>
              <Link to="/admin/excel" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="ti ti-file-spreadsheet" /> Upload Excel Data
              </Link>
              <Link to="/admin/rankings" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="ti ti-trophy" /> View All Rankings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--jio-blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-help" style={{ fontSize: 22, color: 'var(--jio-blue)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16 }}>How to Use This Portal</h3>
            <p style={{ fontSize: 12, marginTop: 2 }}>Step-by-step guide for admins</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {HOW_TO_USE.map(item => (
            <div key={item.step} style={{
              padding: '16px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              transition: 'border-color 0.15s',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: item.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.color }} />
              </div>
              <div>
                <div style={{ marginBottom: 5 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    background: item.color,
                    borderRadius: 20, padding: '1px 8px',
                  }}>
                    STEP {item.step}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
