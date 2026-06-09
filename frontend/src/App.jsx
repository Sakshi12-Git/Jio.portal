import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Component } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import './index.css';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: '#666', maxWidth: 400, textAlign: 'center' }}>{this.state.error.message}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer' }}>Reload</button>
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--jio-blue)', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
          Ji<span style={{ color: 'var(--jio-teal)' }}>o</span>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer'
        }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>

        {/* Welcome card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--jio-blue), var(--jio-blue-light))',
          borderRadius: 14, padding: '20px', color: '#fff', marginBottom: 20
        }}>
          <div style={{ fontSize: 13, opacity: 0.6 }}>Welcome back</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
            {user?.employee_id} · {user?.category} · {user?.region} · {user?.state}
          </div>
        </div>

        {/* Rankings section */}
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 10, paddingLeft: 4
        }}>
          Fiber / Airfiber Installations
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'National Rankings', sub: 'All India leaderboard', icon: 'ti-world', scope: 'national' },
            { label: 'Regional Rankings', sub: user?.region + ' region', icon: 'ti-map', scope: 'regional' },
            { label: 'State Rankings', sub: user?.state, icon: 'ti-building-community', scope: 'state' },
          ].map(item => (
            <div key={item.label} onClick={() => navigate('/leaderboard/' + item.scope)} style={{
              background: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
              gap: 14, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className={'ti ' + item.icon} style={{ fontSize: 20, color: 'var(--jio-blue)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>
              </div>
              <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>

        {/* Account section */}
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 10, paddingLeft: 4
        }}>
          Account
        </div>

        <div
          onClick={() => navigate('/change-password')}
          style={{
            background: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
            gap: 14, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="ti ti-lock" style={{ fontSize: 20, color: '#D97706' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Change Password</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              Update your login password
            </div>
          </div>
          <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)' }} />
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