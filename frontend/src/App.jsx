import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Component, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import './index.css';
import JIO_LOGO from './utils/jioLogo';
import api from './utils/api';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 12, padding: 24,
        background: 'var(--bg)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 28, color: '#DC2626' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: '#666', maxWidth: 400, textAlign: 'center' }}>
          {this.state.error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
          style={{ marginTop: 8 }}
        >
          <i className="ti ti-refresh" /> Reload Page
        </button>
      </div>
    );
    return this.props.children;
  }
}

import LoginPage      from './pages/LoginPage';
import AdminLayout    from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Employees      from './pages/admin/Employees';
import Rankings       from './pages/admin/Rankings';
import Points         from './pages/admin/Points';
import Settings       from './pages/admin/Settings';
import ExcelUpload    from './pages/admin/ExcelUpload';
import Leaderboard    from './pages/employee/Leaderboard';
import ChangePassword from './pages/employee/ChangePassword';

function RequireAdmin({ children }) {
  const { token, isAdmin } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function RequireEmployee({ children }) {
  const { token, isEmployee } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (!isEmployee) return <Navigate to="/admin" replace />;
  return children;
}

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState('');
  const [campaignName, setCampaignName] = useState('');

  useEffect(() => {
    api.get('/employee/settings')
      .then(r => {
        setLogoUrl(r.data.logo_url || '');
        setCampaignName(r.data.campaign_name || '');
      })
      .catch(() => {});
  }, []);

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const menuItems = [
    { label: 'National Rankings',  sub: 'All India leaderboard',   icon: 'ti-world',              scope: 'national', accentBg: 'var(--jio-blue-light)', accentColor: 'var(--jio-blue)' },
    { label: 'Regional Rankings',  sub: (user?.region || '') + ' Region', icon: 'ti-map',         scope: 'regional', accentBg: '#EFF6FF',              accentColor: '#2563EB' },
    { label: 'State Rankings',     sub: user?.state || '',          icon: 'ti-building-community', scope: 'state',    accentBg: '#F0FDF4',              accentColor: '#059669' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        background: 'var(--jio-blue-dark)',
        padding: '0 20px',
        height: 60,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(9,27,90,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          </div>
          {campaignName && (
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              {campaignName}
            </span>
          )}
        </div>

        <button onClick={() => { logout(); navigate('/'); }} style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#fff',
          padding: '7px 16px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'background 0.15s',
          fontFamily: 'inherit',
        }}>
          <i className="ti ti-logout" style={{ fontSize: 15 }} />
          Sign Out
        </button>
      </header>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px' }}>

        {/* Welcome card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--jio-blue-dark) 0%, var(--jio-blue) 100%)',
          borderRadius: 16,
          padding: '24px 20px',
          color: '#fff',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(15,60,201,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            Welcome back
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6 }}>
            {user?.name}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[user?.employee_id, user?.category, user?.region, user?.state].filter(Boolean).map((tag, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 500,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '2px 9px',
                borderRadius: 20,
                color: 'rgba(255,255,255,0.8)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Rankings section */}
        <div className="section-label" style={{ marginBottom: 10 }}>
          Fiber / Airfiber Installations
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {menuItems.map(item => (
            <div
              key={item.label}
              onClick={() => navigate('/leaderboard/' + item.scope)}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                padding: '14px 18px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: item.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.accentColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.sub}
                </div>
              </div>
              <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Account section */}
        <div className="section-label" style={{ marginBottom: 10 }}>Account</div>

        <div
          onClick={() => navigate('/change-password')}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '14px 18px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            boxShadow: 'var(--shadow)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: '#FEF3C7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="ti ti-lock" style={{ fontSize: 20, color: '#D97706' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Change Password</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Update your login password</div>
          </div>
          <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }} />
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminDashboard />} />
                <Route path="employees" element={<Employees />} />
                <Route path="rankings" element={<Rankings />} />
                <Route path="points" element={<Points />} />
                <Route path="excel" element={<ExcelUpload />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="/dashboard" element={<RequireEmployee><EmployeeDashboard /></RequireEmployee>} />
              <Route path="/leaderboard/:scope" element={<RequireEmployee><Leaderboard /></RequireEmployee>} />
              <Route path="/change-password" element={<RequireEmployee><ChangePassword /></RequireEmployee>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
