import { useState, useRef } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';

export default function ExcelUpload() {
  const toast = useToast();

  // Employees section
  const empFileRef = useRef();
  const [empFile, setEmpFile] = useState(null);
  const [empPreview, setEmpPreview] = useState(null);
  const [empImporting, setEmpImporting] = useState(false);
  const [empResult, setEmpResult] = useState(null);

  // Installations section
  const instFileRef = useRef();
  const [instFile, setInstFile] = useState(null);
  const [instPreview, setInstPreview] = useState(null);
  const [instImporting, setInstImporting] = useState(false);
  const [instResult, setInstResult] = useState(null);

  const [clearing, setClearing] = useState('');

  // --- Employee handlers ---
  const handleEmpFile = async (f) => {
    if (!f) return;
    setEmpFile(f);
    setEmpPreview(null);
    setEmpResult(null);
    const formData = new FormData();
    formData.append('file', f);
    try {
      const res = await api.post('/excel/preview-employees', formData);
      setEmpPreview(res.data);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not read file', 'error');
      setEmpFile(null);
    }
  };

  const handleEmpImport = async () => {
    if (!empFile) return;
    setEmpImporting(true);
    const formData = new FormData();
    formData.append('file', empFile);
    try {
      const res = await api.post('/excel/import-employees', formData);
      setEmpResult(res.data);
      setEmpPreview(null);
      setEmpFile(null);
      if (empFileRef.current) empFileRef.current.value = '';
      toast(`✅ ${res.data.empAdded} employees added, ${res.data.empUpdated} updated`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Import failed', 'error');
    } finally {
      setEmpImporting(false);
    }
  };

  // --- Installation handlers ---
  const handleInstFile = async (f) => {
    if (!f) return;
    setInstFile(f);
    setInstPreview(null);
    setInstResult(null);
    const formData = new FormData();
    formData.append('file', f);
    try {
      const res = await api.post('/excel/preview-installations', formData);
      setInstPreview(res.data);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not read file', 'error');
      setInstFile(null);
    }
  };

  const handleInstImport = async () => {
    if (!instFile) return;
    setInstImporting(true);
    const formData = new FormData();
    formData.append('file', instFile);
    try {
      const res = await api.post('/excel/import-installations', formData);
      setInstResult(res.data);
      setInstPreview(null);
      setInstFile(null);
      if (instFileRef.current) instFileRef.current.value = '';
      toast(`✅ ${res.data.instUpdated} installation records updated`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Import failed', 'error');
    } finally {
      setInstImporting(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      const endpoint = type === 'employees' ? '/excel/template-employees' : '/excel/template-installations';
      const filename = type === 'employees' ? 'employees-template.xlsx' : 'installations-template.xlsx';
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast('Could not download template', 'error'); }
  };

  const handleClearInstallations = async () => {
    if (!window.confirm('Clear all installation data? Employees will be kept.')) return;
    setClearing('inst');
    try {
      await api.post('/excel/clear-installations');
      toast('Installation data cleared', 'success');
      setInstResult(null);
    } catch { toast('Failed to clear', 'error'); }
    finally { setClearing(''); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL employees and installations? This cannot be undone.')) return;
    setClearing('all');
    try {
      await api.post('/excel/clear-all');
      toast('All data cleared', 'success');
      setEmpResult(null); setInstResult(null);
    } catch { toast('Failed to clear', 'error'); }
    finally { setClearing(''); }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Excel Data Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
          Upload employees once, then upload daily installations separately
        </p>
      </div>

      {/* Clear buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className="btn" onClick={handleClearInstallations} disabled={clearing === 'inst'}
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}>
          <i className="ti ti-trash" /> {clearing === 'inst' ? 'Clearing…' : 'Clear Installations'}
        </button>
        <button className="btn" onClick={handleClearAll} disabled={clearing === 'all'}
          style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}>
          <i className="ti ti-trash-x" /> {clearing === 'all' ? 'Clearing…' : 'Clear All Data'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ===== SECTION 1: EMPLOYEES ===== */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--jio-blue)' }}>
              <i className="ti ti-users" style={{ marginRight: 8 }} />Upload Employees
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => handleDownload('employees')}>
              <i className="ti ti-download" /> Template
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Upload once. Employees are saved permanently until you clear data.
          </p>

          {/* Drop zone */}
          <div onClick={() => empFileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleEmpFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${empFile ? 'var(--jio-teal)' : 'var(--border)'}`,
              borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer',
              background: empFile ? 'var(--jio-teal-light)' : 'var(--bg)', marginBottom: 12
            }}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 28, color: 'var(--jio-teal)', display: 'block', marginBottom: 6 }} />
            {empFile ? (
              <>
                <div style={{ fontWeight: 600, color: 'var(--jio-teal)', fontSize: 13 }}>{empFile.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(empFile.size/1024).toFixed(1)} KB — Click to change</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Drop employees Excel or click to browse</div>
            )}
          </div>
          <input ref={empFileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
            onChange={e => handleEmpFile(e.target.files[0])} />

          {/* Preview */}
          {empPreview && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--jio-blue)' }}>{empPreview.total}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Employees found</div>
                </div>
                <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>Ready</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>to import</div>
                </div>
              </div>
              {empPreview.employees?.slice(0,2).map(emp => (
                <div key={emp.employee_id} style={{ fontSize: 12, padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{emp.employee_id}</strong> — {emp.name}</span>
                  <span className={`badge ${emp.category === 'CSL' ? 'badge-blue' : 'badge-teal'}`}>{emp.category}</span>
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleEmpImport} disabled={empImporting}
                style={{ width: '100%', marginTop: 8 }}>
                {empImporting
                  ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Importing {empPreview.total} employees…</>
                  : <><i className="ti ti-upload" /> Import {empPreview.total} Employees</>}
              </button>
            </div>
          )}

          {/* Result */}
          {empResult && (
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontWeight: 600, color: '#065F46', marginBottom: 6 }}>✅ Import Successful</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: '#065F46' }}>{empResult.empAdded} new</span> · <span>{empResult.empUpdated} updated</span>
              </div>
              {empResult.newPasswords?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#065F46' }}>
                    🔑 Passwords — save these! Shown only once.
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['ID','Name','Password'].map(h => <th key={h} style={{ padding: '4px 8px', background: 'rgba(6,95,70,0.1)', border: '1px solid #6EE7B7', textAlign: 'left' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {empResult.newPasswords.map(p => (
                          <tr key={p.employee_id}>
                            <td style={{ padding: '4px 8px', border: '1px solid #6EE7B7', background: '#fff' }}>{p.employee_id}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #6EE7B7', background: '#fff' }}>{p.name}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #6EE7B7', background: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>{p.password}</td>
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

        {/* ===== SECTION 2: INSTALLATIONS ===== */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--jio-teal)' }}>
              <i className="ti ti-home-check" style={{ marginRight: 8 }} />Upload Installations
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => handleDownload('installations')}>
              <i className="ti ti-download" /> Template
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Upload daily. Each day's count adds to the week's total automatically.
          </p>

          {/* Drop zone */}
          <div onClick={() => instFileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleInstFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${instFile ? '#0099C2' : 'var(--border)'}`,
              borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer',
              background: instFile ? 'var(--jio-teal-light)' : 'var(--bg)', marginBottom: 12
            }}>
            <i className="ti ti-calendar-stats" style={{ fontSize: 28, color: 'var(--jio-teal)', display: 'block', marginBottom: 6 }} />
            {instFile ? (
              <>
                <div style={{ fontWeight: 600, color: 'var(--jio-teal)', fontSize: 13 }}>{instFile.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(instFile.size/1024).toFixed(1)} KB — Click to change</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Drop installations Excel or click to browse</div>
            )}
          </div>
          <input ref={instFileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
            onChange={e => handleInstFile(e.target.files[0])} />

          {/* Preview */}
          {instPreview && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: 'var(--jio-teal-light)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--jio-teal)' }}>{instPreview.total}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Records found</div>
                </div>
                <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>Ready</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>to upload</div>
                </div>
              </div>
              {instPreview.installations?.slice(0,2).map((inst, i) => (
                <div key={i} style={{ fontSize: 12, padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{inst.employee_id}</strong></span>
                  <span style={{ fontWeight: 600, color: 'var(--jio-teal)' }}>{inst.installations} installs</span>
                </div>
              ))}
              <button className="btn" onClick={handleInstImport} disabled={instImporting}
                style={{ width: '100%', marginTop: 8, background: 'var(--jio-teal)', color: '#fff' }}>
                {instImporting
                  ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</>
                  : <><i className="ti ti-upload" /> Upload {instPreview.total} Records</>}
              </button>
            </div>
          )}

          {/* Result */}
          {instResult && (
            <div style={{ background: 'var(--jio-teal-light)', border: '1px solid var(--jio-teal)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontWeight: 600, color: 'var(--jio-teal)', marginBottom: 4 }}>✅ Installations Updated</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{instResult.instUpdated}</span> records updated
                {instResult.skipped > 0 && <span style={{ color: 'var(--text-muted)' }}> · {instResult.skipped} skipped (unknown IDs)</span>}
              </div>
            </div>
          )}

          {/* Daily instructions */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
            <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
            <strong>Daily workflow:</strong> Download template → fill Employee ID, Name, Installations, today's date → Upload. Rankings update instantly.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}