import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import JIO_LOGO from '../utils/jioLogo';

export default function LoginPage() {
  const [mode, setMode] = useState('employee');
  const [empId, setEmpId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [campaignName, setCampaignName] = useState('Tez-Tarakki Stars');
  const { login, token, role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (token) navigate(role === 'admin' ? '/admin' : '/dashboard');
  }, [token]);

  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    api.get('/employee/settings')
      .then(r => {
        setCampaignName(r.data.campaign_name || 'Tez-Tarakki Stars');
        setLogoUrl(r.data.logo_url || '');
      })
      .catch(() => {});
  }, []);

  const switchMode = (m) => {
    setMode(m);
    setPassword('');
    setShowPwd(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'admin') {
        const res = await api.post('/admin/login', { username, password });
        login(res.data.token, res.data.admin, 'admin');
        toast('Welcome back, ' + res.data.admin.name, 'success');
        navigate('/admin');
      } else {
        const res = await api.post('/employee/login', { employee_id: empId, password });
        login(res.data.token, res.data.user, 'employee');
        if (res.data.must_change_password) {
          toast('Please set a new password to continue', 'info');
          navigate('/change-password');
        } else {
          toast('Welcome, ' + res.data.user.name, 'success');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast(err.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(150deg, var(--jio-blue-dark) 0%, #0F2FA8 55%, var(--jio-blue) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -140, right: -140, width: 460, height: 460, borderRadius: '50%', background: 'rgba(15,60,201,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,153,194,0.08)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 430, position: 'relative' }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}>
            <img
              src={logoUrl || JIO_LOGO}
              alt="Jio"
              style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
            {campaignName}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
            Performance Portal
          </div>
        </div>

        {/* Login card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '32px 32px 28px',
          boxShadow: '0 24px 64px rgba(9,27,90,0.3)',
        }}>

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--border-light)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
            gap: 4,
          }}>
            {[{ id: 'employee', label: 'Employee' }, { id: 'admin', label: 'Admin' }].map(t => (
              <button key={t.id} onClick={() => switchMode(t.id)} style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 7,
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === t.id ? '#fff' : 'transparent',
                color: mode === t.id ? 'var(--jio-blue)' : 'var(--text-muted)',
                boxShadow: mode === t.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'inherit',
              }}>
                {t.id === 'admin' && (
                  <i className="ti ti-shield-check" style={{ fontSize: 13, marginRight: 5, verticalAlign: -1 }} />
                )}
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'employee' ? (
              <div className="form-row">
                <label>Employee ID</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. JIO-01000"
                  value={empId}
                  onChange={e => setEmpId(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            ) : (
              <div className="form-row">
                <label>Username</label>
                <input
                  className="input"
                  type="text"
                  placeholder="admin1"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-row">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter password"
                  style={{ paddingRight: 44 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 17, lineHeight: 1, padding: 2,
                }}>
                  <i className={`ti ${showPwd ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: 8, height: 46, fontSize: 15 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in…</>
                : <><i className="ti ti-login" /> Sign in</>
              }
            </button>
          </form>

          {mode === 'employee' && (
            <div style={{
              marginTop: 20,
              padding: '12px 14px',
              background: 'var(--jio-blue-light)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-secondary)',
              border: '1px solid #C7D2FE',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <i className="ti ti-info-circle" style={{ fontSize: 15, color: 'var(--jio-blue)', marginTop: 1, flexShrink: 0 }} />
              Your access is automatically set based on your category (CSL / XDSS / JDSS)
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Reliance Jio Infocomm Limited - Internal Use Only
        </div>
      </div>
    </div>
  );
}
