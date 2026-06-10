import { useState, useEffect } from 'react';
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
  const [campaignName, setCampaignName] = useState('Jio Portal');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    api.get('/employee/settings')
      .then(r => {
        setCampaignName(r.data.campaign_name || 'Jio Portal');
        setLogoUrl(r.data.logo_url || '');
      })
      .catch(() => {});

    const handler = (e) => {
      if (e.detail.logo_url !== undefined) setLogoUrl(e.detail.logo_url);
      if (e.detail.campaign_name !== undefined) setCampaignName(e.detail.campaign_name || 'Jio Portal');
    };
    window.addEventListener('portalSettingsUpdated', handler);
    return () => window.removeEventListener('portalSettingsUpdated', handler);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/admin/logout'); } catch {}
    logout();
    navigate('/');
  };

  const initials = (user?.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="admin-sidebar" style={{
        width: 248,
        background: 'var(--bg-sidebar)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 200,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* Logo area */}
        <div style={{
          padding: '22px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              <img
                src={logoUrl || JIO_LOGO}
                alt="Jio"
                style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 700,
                letterSpacing: '-0.3px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {campaignName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                Performance Portal
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '4px 12px 8px', textTransform: 'uppercase' }}>
            Menu
          </div>
          {navItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid rgba(255,255,255,0.7)' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              {({ isActive }) => (
                <>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 18, flexShrink: 0, opacity: isActive ? 1 : 0.65 }} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 8,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0F3CC9, #0099C2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0, color: '#fff',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Administrator</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, width: '100%',
            fontSize: 13, fontWeight: 500,
            background: 'rgba(229,57,53,0.12)',
            border: '1px solid rgba(229,57,53,0.25)',
            color: '#F87171',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,57,53,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,57,53,0.12)'}
          >
            <i className="ti ti-logout" style={{ fontSize: 17 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(9,27,90,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 199,
        }} />
      )}

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        marginLeft: 248,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>

        {/* Topbar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          height: 60,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, color: 'var(--text-primary)', lineHeight: 1,
              display: 'none', padding: 4, borderRadius: 6,
            }}
          >
            <i className="ti ti-menu-2" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--jio-blue-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={logoUrl || JIO_LOGO}
                alt="Jio"
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Admin Panel
            </span>
          </div>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
          >
            <i className="ti ti-logout" style={{ fontSize: 15 }} />
            Sign Out
          </button>
        </header>

        <div style={{ flex: 1, padding: '28px' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(${sidebarOpen ? '0' : '-248px'});
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
          }
          .menu-btn { display: block !important; }
          main { margin-left: 0 !important; }
          main > div:last-child { padding: 16px !important; }
          main > header { padding: 0 16px !important; }
        }
        .admin-sidebar { transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}
