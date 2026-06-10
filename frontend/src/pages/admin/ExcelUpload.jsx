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
<<<<<<< HEAD
=======
  const [confirmClear, setConfirmClear] = useState('');
  const [dragOver, setDragOver] = useState(false);
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c

  // --- Employee handlers ---
  const handleEmpFile = async (f) => {
    if (!f) return;
<<<<<<< HEAD
    setEmpFile(f);
    setEmpPreview(null);
    setEmpResult(null);
=======
    setFile(f);
    setPreview(null);
    setImported(null);
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
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
<<<<<<< HEAD
      const res = await api.post('/excel/import-employees', formData);
      setEmpResult(res.data);
      setEmpPreview(null);
      setEmpFile(null);
      if (empFileRef.current) empFileRef.current.value = '';
      toast(`✅ ${res.data.empAdded} employees added, ${res.data.empUpdated} updated`, 'success');
=======
      const res = await api.post('/excel/import', formData);
      setImported(res.data);
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast(`Imported ${res.data.empAdded} new + ${res.data.empUpdated} updated employees`, 'success');
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
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

  const previewStats = [
    { label: 'Employees found',    value: preview?.employees?.length || 0,    color: 'var(--jio-blue)' },
    { label: 'Installations found', value: preview?.installations?.length || 0, color: 'var(--success)' },
    { label: 'Warnings',           value: preview?.errors?.length || 0,        color: preview?.errors?.length ? 'var(--warning)' : 'var(--text-muted)' },
  ];

  return (
    <div>
<<<<<<< HEAD
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
=======
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
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Upload once. Employees are saved permanently until you clear data.
          </p>

<<<<<<< HEAD
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
=======
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
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
          </div>
          <input ref={empFileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
            onChange={e => handleEmpFile(e.target.files[0])} />

<<<<<<< HEAD
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
=======
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
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
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

<<<<<<< HEAD
          {/* Result */}
          {empResult && (
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontWeight: 600, color: '#065F46', marginBottom: 6 }}>✅ Import Successful</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: '#065F46' }}>{empResult.empAdded} new</span> · <span>{empResult.empUpdated} updated</span>
=======
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
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 937b719d3d919f0243c97a907eed46d9bef6695c
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
