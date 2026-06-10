import { useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';

export default function Points() {
  const toast = useToast();
  const [singleId, setSingleId] = useState('');
  const [singlePts, setSinglePts] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const handleSingle = async (e) => {
    e.preventDefault();
    setSingleLoading(true);
    try {
      await api.put('/admin/points', { employee_id: singleId, points: parseInt(singlePts) });
      toast(`Installations updated for ${singleId}`, 'success');
      setSingleId(''); setSinglePts('');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    } finally { setSingleLoading(false); }
  };

  const handleBulk = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean);
    if (!lines.length) return;
    const updates = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length < 2) { toast(`Line ${i + 1}: Invalid format`, 'error'); return; }
      const points = parseInt(parts[1]);
      if (isNaN(points)) { toast(`Line ${i + 1}: Invalid number`, 'error'); return; }
      updates.push({ employee_id: parts[0], points });
    }
    setBulkLoading(true);
    try {
      const res = await api.post('/admin/bulk-points', { updates });
      setBulkResult(res.data);
      toast(`Updated ${res.data.success} employees`, 'success');
      if (res.data.success === res.data.total) setBulkText('');
    } catch { toast('Bulk update failed', 'error'); }
    finally { setBulkLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 26 }}>Installations Management</h1>
        <p>Update employee installation counts individually or in bulk</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="points-grid">

        {/* Single update */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--jio-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-user-check" style={{ fontSize: 18, color: 'var(--jio-blue)' }} />
            </div>
            <h3 style={{ fontSize: 16 }}>Single Update</h3>
          </div>
          <p style={{ fontSize: 13, marginBottom: 24 }}>Update installations for one employee</p>
          <form onSubmit={handleSingle}>
            <div className="form-row">
              <label>Employee ID</label>
              <input className="input" placeholder="JIO-01000" value={singleId} onChange={e => setSingleId(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Installations (this week)</label>
              <input className="input" type="number" min="0" placeholder="e.g. 42" value={singlePts} onChange={e => setSinglePts(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={singleLoading}>
              {singleLoading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Updating…</>
                : <><i className="ti ti-home-check" /> Update Installations</>
              }
            </button>
          </form>
        </div>

        {/* Bulk update */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--jio-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-list-check" style={{ fontSize: 18, color: 'var(--jio-blue)' }} />
            </div>
            <h3 style={{ fontSize: 16 }}>Bulk Update</h3>
          </div>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            Paste data:&nbsp;
            <code style={{ background: 'var(--border-light)', padding: '2px 7px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace' }}>
              employee_id, installations
            </code>
            &nbsp;per line
          </p>
          <div className="form-row">
            <label>Data (one per line)</label>
            <textarea
              className="input"
              rows={8}
              style={{ height: 'auto', resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              placeholder={"JIO-01000, 45\nJIO-01001, 38\nJIO-01002, 52"}
              value={bulkText}
              onChange={e => { setBulkText(e.target.value); setBulkResult(null); }}
            />
          </div>

          {bulkResult && (
            <div style={{
              padding: '12px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
              background: bulkResult.failed?.length ? '#FEF3C7' : '#D1FAE5',
              border: `1px solid ${bulkResult.failed?.length ? '#FCD34D' : '#6EE7B7'}`,
            }}>
              <strong>✓ {bulkResult.success}</strong> updated
              {bulkResult.failed?.length > 0 && (
                <div style={{ marginTop: 5, color: '#92400E' }}>✕ Failed: {bulkResult.failed.join(', ')}</div>
              )}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleBulk} disabled={bulkLoading || !bulkText.trim()}>
            {bulkLoading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing…</>
              : <><i className="ti ti-upload" /> Upload Bulk Installations</>
            }
          </button>
        </div>
      </div>

      {/* Tip */}
      <div className="card" style={{ marginTop: 20, background: 'var(--jio-blue-light)', border: '1px solid #C7D2FE' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--jio-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <i className="ti ti-bulb" style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--jio-blue)', marginBottom: 4 }}>
              Tip: Use Excel Upload for bulk data
            </div>
            <p style={{ fontSize: 13 }}>
              For large daily updates, use the <strong>Excel Upload</strong> page — upload a sheet with Employee ID, Installations,
              and Date columns and it will accumulate counts automatically. Use this page only for quick one-off corrections.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .points-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
