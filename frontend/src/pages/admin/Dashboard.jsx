import { useEffect, useState } from 'react';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/settings'),
      api.get('/admin/rankings?scope=national&limit=5'),
    ]).then(([s, set, r]) => {
      setStats(s.data);
      setSettings(set.data);
      setRankings(r.data.rankings || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      Loading dashboard…
    </div>
  );

  const medals = ['🥇', '🥈', '🥉'];
  const now = new Date();
  const weekNum = getWeekNumber(now);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Welcome back, {user?.name} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {settings.campaign_name} · Week {weekNum}, {now.getFullYear()}
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

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top rankings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>National Top 5</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>This week · All categories</p>
            </div>
            <span className="badge badge-blue">Week {weekNum}</span>
          </div>
          {rankings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No ranking data yet
            </div>
          ) : rankings.map((emp, i) => (
            <div key={emp.employee_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              background: i === 0 ? 'var(--gold-bg)' : i === 1 ? 'var(--silver-bg)' : i === 2 ? 'var(--bronze-bg)' : 'var(--border-light)',
              marginBottom: 6
            }}>
              <span style={{ fontSize: 18, minWidth: 28, textAlign: 'center' }}>
                {i < 3 ? medals[i] : <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>#{emp.rank}</span>}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.employee_id} · {emp.category}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--jio-blue)' }}>
                {emp.points?.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Campaign settings overview */}
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
          <a href="/admin/settings" className="btn btn-secondary btn-sm">
            <i className="ti ti-edit" /> Edit Campaign Settings
          </a>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Quick Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="/admin/employees" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="ti ti-user-plus" /> Add / Manage Employees
              </a>
              <a href="/admin/points" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="ti ti-star" /> Update Points
              </a>
              <a href="/admin/rankings" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="ti ti-trophy" /> View All Rankings
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
