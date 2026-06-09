import { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import JIO_LOGO from '../../utils/jioLogo';

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--jio-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 19, color: 'var(--jio-blue)' }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          {subtitle && <p style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({ campaign_name: '', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const logoInputRef = useRef(null);

  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const [resetEmpId, setResetEmpId] = useState('');
  const [resetPwd, setResetPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      setForm({ campaign_name: r.data.campaign_name || '', tagline: r.data.tagline || '' });
      setLogoUrl(r.data.logo_url || '');
    }).finally(() => setLoading(false));
  }, []);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const broadcastSettings = (patch) =>
    window.dispatchEvent(new CustomEvent('portalSettingsUpdated', { detail: patch }));

  const handleSaveLogo = async () => {
    if (!logoFile) return;
    setLogoSaving(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const res = await api.post('/admin/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(res.data.logo_url);
      setLogoFile(null);
      setLogoPreview('');
      broadcastSettings({ logo_url: res.data.logo_url });
      toast('Logo saved!', 'success');
    } catch { toast('Failed to save logo', 'error'); }
    finally { setLogoSaving(false); }
  };

  const handleRemoveLogo = async () => {
    setLogoSaving(true);
    try {
      await api.delete('/admin/upload-logo');
      setLogoUrl('');
      setLogoFile(null);
      setLogoPreview('');
      broadcastSettings({ logo_url: '' });
      toast('Logo removed, using default', 'success');
    } catch { toast('Failed to remove logo', 'error'); }
    finally { setLogoSaving(false); }
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      broadcastSettings({ campaign_name: form.campaign_name });
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
      await api.post('/admin/change-password', {
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
      await api.post('/admin/reset-employee-password', {
        employee_id: resetEmpId,
        new_password: resetPwd
      });
      toast(`Password reset for ${resetEmpId}`, 'success');
      setResetEmpId(''); setResetPwd('');
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to reset', 'error');
    } finally { setResetLoading(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /> Loading…</div>;

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShowPwd(s => ({ ...s, [field]: !s[field] }))}
      style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: 16, padding: 2,
      }}>
      <i className={`ti ${showPwd[field] ? 'ti-eye-off' : 'ti-eye'}`} />
    </button>
  );

  const PwdField = ({ label, field, key: k, placeholder }) => (
    <div className="form-row">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type={showPwd[k] ? 'text' : 'password'}
          placeholder={placeholder}
          style={{ paddingRight: 44 }}
          value={pwdForm[field]}
          onChange={e => setPwdForm(f => ({ ...f, [field]: e.target.value }))}
          required
        />
        <EyeBtn field={k} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 660 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 26 }}>Settings</h1>
        <p>Campaign, security and account settings</p>
      </div>

      {/* Campaign settings */}
      <SectionCard icon="ti-speakerphone" title="Campaign Settings" subtitle="Shown on the login page and leaderboard">
        <form onSubmit={handleSaveCampaign}>
          <div className="form-row">
            <label>Campaign Name</label>
            <input className="input" value={form.campaign_name}
              onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
              placeholder="e.g. Tez-Tarakki Stars" required />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Shown on login page</div>
          </div>
          <div className="form-row">
            <label>Tagline</label>
            <input className="input" value={form.tagline}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder="e.g. Outperform Your Yesterday" required />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Shown in italic on leaderboard</div>
          </div>

          {/* Live preview */}
          <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--jio-blue)', padding: '10px 16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Preview</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{form.campaign_name || '…'}</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: '10px 16px', fontSize: 13, fontStyle: 'italic', color: 'var(--jio-blue)' }}>
              "{form.tagline || '…'}"
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Saving…</>
              : <><i className="ti ti-device-floppy" /> Save Campaign Settings</>
            }
          </button>
        </form>
      </SectionCard>

      {/* Logo */}
      <SectionCard icon="ti-photo" title="Portal Logo" subtitle="Shown on the login page and sidebar">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 14, flexShrink: 0,
            border: '2px solid var(--border)', background: 'var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', padding: 4,
          }}>
            <img
              src={logoPreview || logoUrl || JIO_LOGO}
              alt="Portal logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }}
            />
          </div>
          <div>
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              Recommended: square image, min 80×80px (PNG or SVG).
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => logoInputRef.current?.click()}>
                <i className="ti ti-upload" /> {logoFile ? 'Change Image' : 'Upload Image'}
              </button>
              {(logoUrl || logoFile) && (
                <button type="button" className="btn btn-sm" onClick={handleRemoveLogo} disabled={logoSaving}
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <i className="ti ti-trash" /> Remove
                </button>
              )}
            </div>
            {logoFile && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                {logoFile.name} — click Save Logo to apply
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleSaveLogo} disabled={logoSaving || !logoFile}>
          {logoSaving
            ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Saving…</>
            : <><i className="ti ti-device-floppy" /> Save Logo</>
          }
        </button>
      </SectionCard>

      {/* Change admin password */}
      <SectionCard icon="ti-lock" title="Change Your Password" subtitle={`Logged in as ${user?.username}`}>
        <form onSubmit={handleChangePassword}>
          {[
            { label: 'Current Password',     field: 'current_password', k: 'current', placeholder: 'Enter current password' },
            { label: 'New Password',          field: 'new_password',     k: 'new',     placeholder: 'Min 8 characters' },
            { label: 'Confirm New Password',  field: 'confirm_password', k: 'confirm', placeholder: 'Re-enter new password' },
          ].map(({ label, field, k, placeholder }) => (
            <div key={field} className="form-row">
              <label>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPwd[k] ? 'text' : 'password'}
                  placeholder={placeholder}
                  style={{ paddingRight: 44 }}
                  value={pwdForm[field]}
                  onChange={e => setPwdForm(f => ({ ...f, [field]: e.target.value }))}
                  required
                />
                <EyeBtn field={k} />
              </div>
            </div>
          ))}

          <div style={{
            background: 'var(--border-light)', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)',
          }}>
            <i className="ti ti-info-circle" style={{ marginRight: 5, verticalAlign: -1 }} />
            Password must be at least 8 characters. No OTP or verification required.
          </div>

          <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
            {pwdLoading
              ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Changing…</>
              : <><i className="ti ti-key" /> Change Password</>
            }
          </button>
        </form>
      </SectionCard>

      {/* Reset employee password */}
      <SectionCard icon="ti-user-cog" title="Reset Employee Password" subtitle="Use if an employee forgets their password — they'll be forced to change it on next login">
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
            {resetLoading
              ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Resetting…</>
              : <><i className="ti ti-refresh" /> Reset Password</>
            }
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
