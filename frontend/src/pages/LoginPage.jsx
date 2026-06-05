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
  const [loading, setLoading] = useState(false);
  const [campaignName, setCampaignName] = useState('Tez-Tarakki Stars');
  const { login, token, role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (token) navigate(role === 'admin' ? '/admin' : '/dashboard');
  }, [token]);

  useEffect(() => {
    api.get('/employee/settings')
      .then(r => setCampaignName(r.data.campaign_name || 'Tez-Tarakki Stars'))
      .catch(() => {});
  }, []);

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
        toast('Welcome, ' + res.data.user.name, 'success');
        navigate('/dashboard');
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
      background: 'linear-gradient(145deg, #00154a 0%, #002070 55%, #003090 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 420, height: 420, borderRadius: '50%', background: 'rgba(0,153,194,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img
            src={JIO_LOGO}
            alt="Jio"
            style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '3px solid rgba(255,255,255,0.15)' }}
          />
          <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
            {campaignName}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
            Performance Portal
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 18, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', background: '#EAECF0', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[{id:'employee',label:'Employee'},{id:'admin',label:'Admin'}].map(t => (
              <button key={t.id} onClick={() => setMode(t.id)} style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                background: mode === t.id ? '#fff' : 'transparent',
                color: mode === t.id ? 'var(--jio-blue)' : 'var(--text-muted)',
                boxShadow: mode === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
                {t.id === 'admin' && <i className="ti ti-shield" style={{ fontSize: 13, marginRight: 5, verticalAlign: -1 }} />}
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'employee' ? (
              <div className="form-row">
                <label>Employee ID</label>
                <input className="input" type="text" placeholder="e.g. JIO-01000"
                  value={empId} onChange={e => setEmpId(e.target.value)} required autoFocus />
              </div>
            ) : (
              <div className="form-row">
                <label>Username</label>
                <input className="input" type="text" placeholder="admin1"
                  value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
              </div>
            )}
            <div className="form-row">
              <label>Password</label>
              <input className="input" type="password" placeholder="Enter password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {mode === 'employee' && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#EEF2FF', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <i className="ti ti-info-circle" style={{ fontSize: 13, verticalAlign: -1, marginRight: 5 }} />
              Your access is automatically set based on your category (CSL / XDSS / JDSS)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
