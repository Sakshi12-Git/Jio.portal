import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import JIO_LOGO from '../utils/jioLogo';

const navItems = [
  { to: '/admin',           icon: 'ti-layout-dashboard', label: 'Dashboard',    end: true },
  { to: '/admin/employees', icon: 'ti-users',            label: 'Employees'    },
  { to: '/admin/rankings',  icon: 'ti-trophy',           label: 'Rankings'     },
  { to: '/admin/excel',     icon: 'ti-file-spreadsheet', label: 'Excel Upload' },
  { to: '/admin/settings',  icon: 'ti-settings',         label: 'Settings'     },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/admin/logout'); } catch {}
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg-sidebar)', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 200,
      }} className="admin-sidebar">

        {/* Logo + user */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img
              src={JIO_LOGO}
              alt="Jio"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#fff', padding: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Jio Portal</div>
              <div style={{ fontSize: 11, opacity: 0.45 }}>Performance Portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--jio-teal)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0
            }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: 11, opacity: 0.45 }}>Administrator</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 18 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, width: '100%',
            fontSize: 14, fontWeight: 500,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5', cursor: 'pointer',
          }}>
            <i className="ti ti-logout" style={{ fontSize: 18 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199,
        }} />
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text-primary)', lineHeight: 1, display: 'none',
          }} className="menu-btn">
            <i className="ti ti-menu-2" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={JIO_LOGO} alt="Jio" style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', padding: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Admin Panel</span>
          </div>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            background: '#FEE2E2', border: '1px solid #FECACA',
            color: '#DC2626', cursor: 'pointer',
          }}>
            <i className="ti ti-logout" style={{ fontSize: 15 }} />
            Sign Out
          </button>
        </div>

        <div style={{ flex: 1, padding: '28px' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(${sidebarOpen ? '0' : '-240px'}); transition: transform 0.25s; }
          .menu-btn { display: block !important; }
          main { margin-left: 0 !important; }
          main > div:last-child { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}