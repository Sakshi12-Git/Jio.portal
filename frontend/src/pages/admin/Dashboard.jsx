import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 22, color }} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
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
      step: '1',
      icon: 'ti-file-spreadsheet',
      color: '#0099C2',
      title: 'Upload Employee Data',
      desc: 'Go to Excel Upload → Download the template → Fill Employee IDs, Names, Category (CSL/XDSS/JDSS), Region, State, and Mobile number → Upload.'
    },
    {
      step: '2',
      icon: 'ti-lock',
      color: '#7C3AED',
      title: 'Share Login Credentials',
      desc: 'Passwords are auto-generated as EP@ + last 5 digits of mobile number. Share Employee ID and password with each employee.'
    },
    {
      step: '3',
      icon: 'ti-home-check',
      color: '#059669',
      title: 'Upload Daily Installations',
      desc: 'Every day, download the template → fill Employee ID, installations count, and today\'s date (DD-MM-YYYY) → Upload. Daily counts add up automatically.'
    },
    {
      step: '4',
      icon: 'ti-trophy',
      color: '#D97706',
      title: 'Track Rankings',
      desc: 'Go to Rankings to view National, Regional, and State leaderboards. Filter by category (CSL / XDSS+JDSS) and switch between weekly and monthly view.'
    },
    {
      step: '5',
      icon: 'ti-settings',
      color: '#DC2626',
      title: 'Manage Settings',
      desc: 'Update campaign name, tagline, and admin passwords from Settings. Reset any employee password from the Employees page.'
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Welcome back, {user?.name} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {settings.campaign_name} · {weekLabel} · {monthLabel}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="ti-users" label="Total Employees" value={stats?.total?.toLocaleString() || 0} color="var(--jio-blue)" />
        <StatCard icon="ti-id" label="CSL Employees" value={stats?.csl?.toLocaleString() || 0} color="var(--jio-teal)" />
        <StatCard icon="ti-network" label="XDSS Employees" value={stats?.xdss?.toLocaleString() || 0} color="var(--warning)" />
        <StatCard icon="ti-device-mobile" label="JDSS Employees" value={stats?.jdss?.toLocaleString() || 0} color="var(--success)" />
        <StatCard
          icon="ti-shield"
          label="Active Admin Sessions"
          value={`${stats?.adminsActive || 0} / ${stats?.maxAdmins || 3}`}
          color="var(--danger)"
          sub="Max 3 simultaneous sessions"
        />
      </div>

      {/* Installations this week + Campaign settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Installations this week */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Installations This Week</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{weekLabel} · {monthLabel}</p>
            </div>
            <span className="badge badge-blue">{weekLabel}</span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #002070, #003fa8)',
            borderRadius: 12, padding: '20px', color: '#fff', marginBottom: 16, textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              Total Installations
            </div>
            <div style={{ fontSize: 42, fontWeight: 700 }}>
              {instStats?.total?.toLocaleString() || '0'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
              across {instStats?.activeEmployees || '0'} active employees
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'CSL', value: instStats?.csl, color: 'var(--jio-teal)', bg: '#EEF2FF' },
              { label: 'XDSS', value: instStats?.xdss, color: 'var(--warning)', bg: '#FFFBEB' },
              { label: 'JDSS', value: instStats?.jdss, color: 'var(--success)', bg: '#F0FDF4' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>
                  {c.value?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {instStats?.topPerformer && (
            <div style={{
              marginTop: 14, padding: '12px 14px',
              background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 22 }}>🥇</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{instStats.topPerformer.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {instStats.topPerformer.category} · Top performer this week
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--jio-blue)' }}>
                {instStats.topPerformer.points} <span style={{ fontSize: 11, fontWeight: 400 }}>installs</span>
              </div>
            </div>
          )}
        </div>

        {/* Campaign settings */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Campaign Settings</h2>
          <div style={{ marginBottom: 14 }}>
            <label>Campaign Name</label>
            <div style={{ padding: '10px 14px', background: 'var(--border-light)', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
              {settings.campaign_name}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Tagline</label>
            <div style={{ padding: '10px 14px', background: 'var(--border-light)', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
              {settings.tagline}
            </div>
          </div>
          <Link to="/admin/settings" className="btn btn-secondary btn-sm">
            <i className="ti ti-edit" /> Edit Campaign Settings
          </Link>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Quick Links</h3>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-help" style={{ fontSize: 20, color: 'var(--jio-blue)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>How to Use This Portal</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Step-by-step guide for admins</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {HOW_TO_USE.map((item) => (
            <div key={item.step} style={{
              padding: '16px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'var(--bg)', display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.color }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: item.color, borderRadius: 20, padding: '1px 7px' }}>
                    STEP {item.step}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}