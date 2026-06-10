import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import api from '../../utils/api';
import JIO_LOGO from '../../utils/jioLogo';

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    api.get('/employee/settings').then(r => setLogoUrl(r.data.logo_url || '')).catch(() => {});
  }, []);

  const passwordsMatch = newPwd && confirmPwd && newPwd === confirmPwd;
  const passwordsMismatch = newPwd && confirmPwd && newPwd !== confirmPwd;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/employee/change-password', {
        current_password: currentPwd,
        new_password: newPwd,
        confirm_password: confirmPwd,
      });
      toast('Password changed successfully!', 'success');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 40 }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, var(--jio-blue-dark), var(--jio-blue))',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 16px rgba(9,27,90,0.3)',
      }}>
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          width: 36, height: 36, borderRadius: 9,
          cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Account
          </div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginTop: 1 }}>Change Password</div>
        </div>
      </header>

      <div style={{ maxWidth: 460, margin: '28px auto', padding: '0 16px' }}>

        {/* User identity card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--jio-blue-dark), var(--jio-blue))',
          borderRadius: 14,
          padding: '16px 20px',
          color: '#fff',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 6px 20px rgba(15,60,201,0.25)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {user?.employee_id} · {user?.category}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>Set New Password</h3>
          <p style={{ fontSize: 13, marginBottom: 24 }}>
            Your default password is <strong>EP@</strong> followed by the last 5 digits of your registered mobile number.
          </p>

          <form onSubmit={handleSubmit}>

            {/* Current password */}
            <div className="form-row">
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 17, lineHeight: 1,
                }}>
                  <i className={`ti ${showCurrent ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="form-row">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 17, lineHeight: 1,
                }}>
                  <i className={`ti ${showNew ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="form-row">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  required
                  style={{
                    paddingRight: 44,
                    borderColor: passwordsMismatch ? 'var(--danger)' : passwordsMatch ? 'var(--success)' : undefined,
                    boxShadow: passwordsMismatch
                      ? '0 0 0 3px rgba(229,57,53,0.1)'
                      : passwordsMatch
                      ? '0 0 0 3px rgba(0,178,89,0.1)'
                      : undefined,
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 17, lineHeight: 1,
                }}>
                  <i className={`ti ${showConfirm ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              {passwordsMismatch && (
                <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-x" style={{ fontSize: 13 }} /> Passwords do not match
                </div>
              )}
              {passwordsMatch && (
                <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-check" style={{ fontSize: 13 }} /> Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !!passwordsMismatch || !currentPwd || !newPwd || !confirmPwd}
              style={{ marginTop: 8, height: 46, fontSize: 15 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Changing…</>
                : <><i className="ti ti-lock-check" /> Change Password</>
              }
            </button>
          </form>
        </div>

        {/* Help note */}
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'var(--jio-blue-light)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--text-secondary)',
          border: '1px solid #C7D2FE',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 15, color: 'var(--jio-blue)', marginTop: 1, flexShrink: 0 }} />
          No OTP needed. Just enter your current password and set a new one.
        </div>
      </div>
    </div>
  );
}
