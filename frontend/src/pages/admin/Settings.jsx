import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();

  // Campaign settings
  const [form, setForm] = useState({ campaign_name: '', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin password change
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  // Employee password reset
  const [resetEmpId, setResetEmpId] = useState('');
  const [resetPwd, setResetPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      setForm({ campaign_name: r.data.campaign_name || '', tagline: r.data.tagline || '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      toast('Campaign settings saved!', 'success');
    } catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast('New passwords do not match', 'error'); return;
    }
    if (pwdForm.new_password.length < 8) {
      toast('Password must be at least 8 characters', 'error'); return;
    }
    setPwdLoading(true);
    try {
      await api.post('/excel/admin-change-password', {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password
      });
      toast('Password changed successfully!', 'success');
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to change password', 'error');
    } finally { setPwdLoading(false); }
  };

  const handleResetEmployeePwd = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await api.post('/excel/admin-reset-password', {
        employee_id: resetEmpId,
        new_password: resetPwd
      });
      toast(`Password reset for ${resetEmpId}`, 'success');
      setResetEmpId(''); setResetPwd('');
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to reset', 'error');
    } finally { setResetLoading(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" />Loading…</div>;

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShowPwd(s => ({ ...s, [field]: !s[field] }))}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>
      <i className={`ti ${showPwd[field] ? 'ti-eye-off' : 'ti-eye'}`} />
    </button>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Campaign, security and account settings</p>
      </div>

      {/* Campaign settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          <i className="ti ti-speakerphone" style={{ marginRight: 8, color: 'var(--jio-blue)' }} />
          Campaign Settings
        </h2>
        <form onSubmit={handleSaveCampaign}>
          <div className="form-row">
            <label>Campaign Name</label>
            <input className="input" value={form.campaign_name}
              onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
              placeholder="e.g. Tez-Tarakki Stars" required />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Shown on login page</p>
          </div>
          <div className="form-row">
            <label>Tagline</label>
            <input className="input" value={form.tagline}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder="e.g. Outperform Your Yesterday" required />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Shown in italic on leaderboard</p>
          </div>

          {/* Live preview */}
          <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--jio-blue)', padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>PREVIEW</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{form.campaign_name || '…'}</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: '8px 14px', fontSize: 13, fontStyle: 'italic', color: 'var(--jio-blue)' }}>
              "{form.tagline || '…'}"
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : <><i className="ti ti-device-floppy" /> Save Campaign Settings</>}
          </button>
        </form>
      </div>

      {/* Admin change own password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          <i className="ti ti-lock" style={{ marginRight: 8, color: 'var(--jio-blue)' }} />
          Change Your Password
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Logged in as <strong>{user?.username}</strong>
        </p>
        <form onSubmit={handleChangePassword}>
          {[
            { label: 'Current Password', field: 'current_password', key: 'current' },
            { label: 'New Password', field: 'new_password', key: 'new' },
            { label: 'Confirm New Password', field: 'confirm_password', key: 'confirm' },
          ].map(({ label, field, key }) => (
            <div key={field} className="form-row">
              <label>{label}</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPwd[key] ? 'text' : 'password'}
                  style={{ paddingRight: 40 }}
                  value={pwdForm[field]}
                  onChange={e => setPwdForm(f => ({ ...f, [field]: e.target.value }))}
                  required />
                <EyeBtn field={key} />
              </div>
            </div>
          ))}
          <div style={{ background: 'var(--border-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            Password must be at least 8 characters. No OTP or verification required.
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
            {pwdLoading ? 'Changing…' : <><i className="ti ti-key" /> Change Password</>}
          </button>
        </form>
      </div>

      {/* Reset employee password */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          <i className="ti ti-user-cog" style={{ marginRight: 8, color: 'var(--jio-blue)' }} />
          Reset Employee Password
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Use this if an employee forgets their password. They'll be forced to change it on next login.
        </p>
        <form onSubmit={handleResetEmployeePwd}>
          <div className="form-grid">
            <div className="form-row">
              <label>Employee ID</label>
              <input className="input" placeholder="1234567" value={resetEmpId}
                onChange={e => setResetEmpId(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>New Temporary Password</label>
              <input className="input" placeholder="Min 6 characters" value={resetPwd}
                onChange={e => setResetPwd(e.target.value)} required minLength={6} />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary" disabled={resetLoading}>
            {resetLoading ? 'Resetting…' : <><i className="ti ti-refresh" /> Reset Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}