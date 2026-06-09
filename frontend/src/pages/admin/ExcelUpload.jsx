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
  const [confirmClear, setConfirmClear] = useState(''); // 'inst' | 'all' | ''

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
      toast(`✅ Imported ${res.data.empAdded} new + ${res.data.empUpdated} updated employees`, 'success');
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Excel Data Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
          Upload Excel to update employees and installation data
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: confirmClear ? 0 : 24, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
          <i className="ti ti-download" /> Download Template
        </button>
        <button className="btn" onClick={() => setConfirmClear(confirmClear === 'inst' ? '' : 'inst')} disabled={!!clearing}
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}>
          <i className="ti ti-trash" /> Clear Installations
        </button>
        <button className="btn" onClick={() => setConfirmClear(confirmClear === 'all' ? '' : 'all')} disabled={!!clearing}
          style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}>
          <i className="ti ti-trash-x" /> Clear All Data
        </button>
      </div>

      {/* Inline confirmation */}
      {confirmClear && (
        <div style={{
          marginBottom: 24, padding: '14px 16px', borderRadius: 10,
          background: confirmClear === 'all' ? '#FEE2E2' : '#FEF3C7',
          border: `1px solid ${confirmClear === 'all' ? '#FECACA' : '#FCD34D'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: confirmClear === 'all' ? '#991B1B' : '#92400E' }}>
            {confirmClear === 'all'
              ? 'This will permanently delete ALL employees and installation data.'
              : 'This will clear all installation data. Employee accounts will be kept.'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClear('')}>Cancel</button>
            <button className="btn btn-sm" disabled={!!clearing}
              onClick={confirmClear === 'all' ? handleClearAll : handleClearInstallations}
              style={{ background: confirmClear === 'all' ? '#DC2626' : '#D97706', color: '#fff', border: 'none' }}>
              {clearing ? 'Clearing…' : 'Yes, clear'}
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Upload Excel File</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          File must have two sheets: <strong>Employees</strong> and <strong>Installations</strong>
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${file ? 'var(--jio-teal)' : 'var(--border)'}`,
            borderRadius: 10, padding: '32px 20px', textAlign: 'center',
            cursor: 'pointer', background: file ? 'var(--jio-teal-light)' : 'var(--bg)',
            transition: 'all 0.2s',
          }}
        >
          <i className="ti ti-file-spreadsheet" style={{ fontSize: 36, color: 'var(--jio-teal)', display: 'block', marginBottom: 8 }} />
          {file ? (
            <>
              <div style={{ fontWeight: 600, color: 'var(--jio-teal)' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB — Click to change
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 500 }}>Drop your Excel file here or click to browse</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>.xlsx files only</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* Preview */}
      {preview && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <i className="ti ti-eye" style={{ marginRight: 6 }} /> Preview
          </h2>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Employees found', value: preview.employees?.length || 0, color: 'var(--jio-blue)' },
              { label: 'Installations found', value: preview.installations?.length || 0, color: 'var(--jio-teal)' },
              { label: 'Warnings', value: preview.errors?.length || 0, color: preview.errors?.length ? '#D97706' : 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {preview.errors?.length > 0 && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
              <strong>⚠️ Warnings ({preview.errors.length})</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                {preview.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                {preview.errors.length > 5 && <li>…and {preview.errors.length - 5} more</li>}
              </ul>
            </div>
          )}

          {/* First 3 employees */}
          {preview.employees?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                First 3 Employees
              </div>
              {preview.employees.slice(0, 3).map(emp => (
                <div key={emp.employee_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 6,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>{emp.employee_id}</span>
                    <span style={{ fontWeight: 500 }}>{emp.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`badge ${emp.category === 'CSL' ? 'badge-blue' : 'badge-teal'}`}>{emp.category}</span>
                    <span className="badge badge-gray" style={{ color: emp.active ? '#059669' : '#DC2626' }}>
                      {emp.active ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Import button */}
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || !preview.employees?.length}
            style={{ fontSize: 15, padding: '12px 28px' }}
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
        <div className="card" style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#065F46' }}>
            ✅ Import Successful
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'New employees added', value: imported.empAdded },
              { label: 'Employees updated', value: imported.empUpdated },
              { label: 'Installation records', value: imported.instUpdated },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#065F46' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* New passwords table */}
          {imported.newPasswords?.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#065F46' }}>
                🔑 Generated Passwords — Save these now! Shown only once.
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee ID', 'Name', 'Password'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', background: 'rgba(6,95,70,0.1)', border: '1px solid #6EE7B7', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imported.newPasswords.map(p => (
                      <tr key={p.employee_id}>
                        <td style={{ padding: '7px 12px', border: '1px solid #6EE7B7', background: '#fff' }}>{p.employee_id}</td>
                        <td style={{ padding: '7px 12px', border: '1px solid #6EE7B7', background: '#fff' }}>{p.name}</td>
                        <td style={{ padding: '7px 12px', border: '1px solid #6EE7B7', background: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>{p.password}</td>
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