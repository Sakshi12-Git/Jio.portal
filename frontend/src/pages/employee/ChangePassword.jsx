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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ background: 'var(--jio-blue)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <i className="ti ti-arrow-left" />
        </button>
        <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', padding: 2, flexShrink: 0, objectFit: 'contain' }} />
        <div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Account</div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>Change Password</div>
        </div>
      </div>

      <div style={{ maxWidth: 440, margin: '28px auto', padding: '0 16px' }}>

        {/* Info card */}
        <div style={{
          background: 'linear-gradient(135deg, #002070, #003fa8)',
          borderRadius: 14, padding: '16px 18px', color: '#fff', marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700
            }}>
              {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>{user?.employee_id} · {user?.category}</div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Set New Password</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
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
                  style={{ paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16
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
                  style={{ paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16
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
                    paddingRight: 42,
                    borderColor: passwordsMismatch ? '#EF4444' : passwordsMatch ? '#10B981' : undefined
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16
                }}>
                  <i className={`ti ${showConfirm ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              {passwordsMismatch && (
                <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                  ✕ Passwords do not match
                </div>
              )}
              {passwordsMatch && (
                <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                  ✓ Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || passwordsMismatch || !currentPwd || !newPwd || !confirmPwd}
              style={{ width: '100%', marginTop: 8, padding: '12px', fontSize: 15 }}
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
          marginTop: 16, padding: '12px 14px',
          background: '#EEF2FF', borderRadius: 10,
          fontSize: 12, color: 'var(--text-secondary)',
          border: '1px solid #C7D2FE'
        }}>
          <i className="ti ti-info-circle" style={{ marginRight: 6, verticalAlign: -1 }} />
          No OTP needed. Just enter your current password and set a new one.
        </div>
      </div>
    </div>
  );
}