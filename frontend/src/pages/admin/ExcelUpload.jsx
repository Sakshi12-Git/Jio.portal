import { useState, useRef } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';

export default function ExcelUpload() {
  const toast = useToast();
  const fileRef = useRef();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(null);
  const [clearing, setClearing] = useState('');
  const [confirmClear, setConfirmClear] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setPreview(null);
    setImported(null);
    const formData = new FormData();
    formData.append('file', f);
    try {
      const res = await api.post('/excel/preview', formData);
      setPreview(res.data);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not read file', 'error');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/excel/import', formData);
      setImported(res.data);
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast(`Imported ${res.data.empAdded} new + ${res.data.empUpdated} updated employees`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleClearInstallations = async () => {
    setClearing('inst');
    setConfirmClear('');
    try {
      await api.post('/excel/clear-installations');
      toast('Installation data cleared', 'success');
      setImported(null);
    } catch {
      toast('Failed to clear', 'error');
    } finally { setClearing(''); }
  };

  const handleClearAll = async () => {
    setClearing('all');
    setConfirmClear('');
    try {
      await api.post('/excel/clear-all');
      toast('All data cleared', 'success');
      setPreview(null);
      setImported(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      toast('Failed to clear', 'error');
    } finally { setClearing(''); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/excel/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jio-portal-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Could not download template', 'error');
    }
  };

  const previewStats = [
    { label: 'Employees found',    value: preview?.employees?.length || 0,    color: 'var(--jio-blue)' },
    { label: 'Installations found', value: preview?.installations?.length || 0, color: 'var(--success)' },
    { label: 'Warnings',           value: preview?.errors?.length || 0,        color: preview?.errors?.length ? 'var(--warning)' : 'var(--text-muted)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 26 }}>Excel Data Management</h1>
        <p>Upload Excel to update employees and installation data</p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: confirmClear ? 0 : 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleDownloadTemplate}>
          <i className="ti ti-download" /> Download Template
        </button>
        <button className="btn btn-warn" onClick={() => setConfirmClear(confirmClear === 'inst' ? '' : 'inst')} disabled={!!clearing}>
          <i className="ti ti-trash" /> Clear Installations
        </button>
        <button className="btn btn-sm" onClick={() => setConfirmClear(confirmClear === 'all' ? '' : 'all')} disabled={!!clearing}
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
          <i className="ti ti-trash-x" /> Clear All Data
        </button>
      </div>

      {/* Inline confirmation */}
      {confirmClear && (
        <div style={{
          marginBottom: 24, padding: '14px 18px', borderRadius: 10,
          background: confirmClear === 'all' ? '#FEE2E2' : '#FEF3C7',
          border: `1px solid ${confirmClear === 'all' ? '#FECACA' : '#FCD34D'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className={`ti ${confirmClear === 'all' ? 'ti-alert-triangle' : 'ti-alert-circle'}`}
              style={{ fontSize: 18, color: confirmClear === 'all' ? '#DC2626' : '#D97706' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: confirmClear === 'all' ? '#991B1B' : '#92400E' }}>
              {confirmClear === 'all'
                ? 'This will permanently delete ALL employees and installation data.'
                : 'This will clear all installation data. Employee accounts will be kept.'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClear('')}>Cancel</button>
            <button
              className={`btn btn-sm ${confirmClear === 'all' ? 'btn-danger' : 'btn-warn'}`}
              disabled={!!clearing}
              onClick={confirmClear === 'all' ? handleClearAll : handleClearInstallations}
            >
              {clearing ? 'Clearing…' : 'Yes, clear'}
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Upload Excel File</h3>
        <p style={{ fontSize: 13, marginBottom: 20 }}>
          File must have two sheets: <strong>Employees</strong> and <strong>Installations</strong>
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${file || dragOver ? 'var(--jio-blue)' : 'var(--border)'}`,
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: file || dragOver ? 'var(--jio-blue-light)' : 'var(--bg)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: file ? 'var(--jio-blue)' : 'var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 28, color: file ? '#fff' : 'var(--text-muted)' }} />
          </div>
          {file ? (
            <>
              <div style={{ fontWeight: 600, color: 'var(--jio-blue)', fontSize: 15 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change file
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Drop your Excel file here</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>or click to browse · .xlsx files only</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* Preview */}
      {preview && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--jio-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-eye" style={{ fontSize: 18, color: 'var(--jio-blue)' }} />
            </div>
            <h3 style={{ fontSize: 16 }}>Preview</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {previewStats.map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 12px', boxShadow: 'none' }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {preview.errors?.length > 0 && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #FCD34D',
              borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13,
            }}>
              <strong>⚠ Warnings ({preview.errors.length})</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {preview.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                {preview.errors.length > 5 && <li style={{ color: 'var(--text-muted)' }}>…and {preview.errors.length - 5} more</li>}
              </ul>
            </div>
          )}

          {preview.employees?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                First 3 Employees
              </div>
              {preview.employees.slice(0, 3).map(emp => (
                <div key={emp.employee_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 6,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.employee_id}</span>
                    <span style={{ fontWeight: 500 }}>{emp.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${emp.category === 'CSL' ? 'badge-blue' : 'badge-teal'}`}>{emp.category}</span>
                    <span className={`badge ${emp.active ? 'badge-green' : 'badge-red'}`}>
                      {emp.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || !preview.employees?.length}
            style={{ padding: '11px 28px', fontSize: 15 }}
          >
            {importing
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Importing…</>
              : <><i className="ti ti-upload" /> Import {preview.employees?.length} Employees + {preview.installations?.length} Installations</>
            }
          </button>
        </div>
      )}

      {/* Import result */}
      {imported && (
        <div className="card" style={{ marginBottom: 20, background: '#F0FDF4', border: '1px solid #6EE7B7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-check" style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <h3 style={{ fontSize: 16, color: '#065F46' }}>Import Successful</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'New employees added',   value: imported.empAdded },
              { label: 'Employees updated',     value: imported.empUpdated },
              { label: 'Installation records',  value: imported.instUpdated },
            ].map(s => (
              <div key={s.label} style={{
                background: '#fff', borderRadius: 10, padding: '14px',
                textAlign: 'center', border: '1px solid #A7F3D0',
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#059669' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {imported.newPasswords?.length > 0 && (
            <div>
              <div style={{
                fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#065F46',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <i className="ti ti-key" style={{ fontSize: 16 }} />
                Generated Passwords — Save these now! Shown only once.
              </div>
              <div style={{ overflowX: 'auto', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee ID', 'Name', 'Password'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', background: 'rgba(6,95,70,0.08)', borderBottom: '1px solid #A7F3D0', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#065F46' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imported.newPasswords.map((p, i) => (
                      <tr key={p.employee_id} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(240,253,244,0.6)' }}>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #D1FAE5' }}>{p.employee_id}</td>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #D1FAE5' }}>{p.name}</td>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #D1FAE5', fontFamily: 'monospace', fontWeight: 600, color: '#065F46' }}>{p.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
