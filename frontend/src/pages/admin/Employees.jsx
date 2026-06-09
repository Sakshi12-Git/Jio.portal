import { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';

const CATEGORIES = ['CSL', 'XDSS', 'JDSS'];
const REGIONS = ['North', 'South', 'East', 'West'];
const STATES = {
  North: ['Delhi', 'Haryana', 'Punjab', 'Kashmir', 'Rajasthan', 'Jammu', 'Uttar Pradesh (East)', 'Uttar Pradesh (West)', 'Himachal Pradesh', 'Uttarakhand'],
  South: ['Andhra Pradesh', 'Telangana', 'Kerala', 'Tamil Nadu', 'Karnataka'],
  West: ['MP & CG', 'Mumbai', 'Mah & Goa', 'Gujarat'],
  East: ['Assam', 'Kolkata', 'West Bengal', 'Jharkhand', 'Bihar', 'Orissa', 'North East'],
};

const emptyForm = { employee_id: '', name: '', category: 'CSL', region: 'North', state: 'Delhi', password: '' };

function PwdInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" type={show ? 'text' : 'password'} placeholder={placeholder}
        style={{ paddingRight: 40 }} value={value} onChange={onChange} />
      <button type="button" onClick={() => setShow(s => !s)} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
      }}>
        <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'}`} />
      </button>
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

const LIMIT = 15;

export default function Employees() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const debounceRef = useRef(null);

  const fetchEmployees = async (s, p, cat) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/employees', {
        params: { search: s, page: p, limit: LIMIT, category: cat }
      });
      setEmployees(res.data.employees || []);
      setTotal(res.data.total || 0);
    } catch {
      toast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(search, page, filterCat);
  }, [page, filterCat]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchEmployees(val, 1, filterCat);
    }, 400);
  };

  const handleCatChange = (val) => {
    setFilterCat(val);
    setPage(1);
  };

  const handleAdd = async () => {
    if (!form.employee_id.trim() || !form.name.trim() || !form.password.trim()) {
      toast('Employee ID, Name and Password are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/employees', form);
      toast('Employee added successfully', 'success');
      const addedId = form.employee_id.trim();
      setShowAdd(false);
      setForm(emptyForm);
      setPage(1);
      setSearch(addedId);
      fetchEmployees(addedId, 1, filterCat);
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to add', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/admin/employees/${editEmp.employee_id}`, form);
      toast('Employee updated', 'success');
      setEditEmp(null);
      fetchEmployees(search, page, filterCat);
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to update', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (empId) => {
    try {
      await api.delete(`/admin/employees/${empId}`);
      toast('Employee deactivated', 'success');
      setDeleteConfirm(null);
      fetchEmployees(search, page, filterCat);
    } catch {
      toast('Failed to deactivate', 'error');
    }
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ name: emp.name, category: emp.category, region: emp.region, state: emp.state, password: '' });
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Employees</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
            {total.toLocaleString()} total employees
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setForm(emptyForm); }}>
          <i className="ti ti-user-plus" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search name or employee ID…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <select className="select" style={{ width: 160 }} value={filterCat}
            onChange={e => handleCatChange(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Category</th>
                <th>Region</th>
                <th>State</th>
                <th>Installations (this week)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 8px' }} /> Loading…
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No employees found
                </td></tr>
              ) : employees.map(emp => (
                <tr key={emp.employee_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--jio-blue)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, flexShrink: 0
                      }}>
                        {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{emp.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 13 }}>{emp.employee_id}</span></td>
                  <td>
                    <span className={`badge ${emp.category === 'CSL' ? 'badge-blue' : 'badge-teal'}`}>
                      {emp.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{emp.region}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{emp.state}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: emp.points > 0 ? 'var(--jio-blue)' : 'var(--text-muted)' }}>
                      {emp.points > 0 ? emp.points?.toLocaleString() : '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}>
                        <i className="ti ti-edit" />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(emp)}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
            </span>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <i className="ti ti-chevron-left" />
              </button>
              {(() => {
                const pages = [];
                let start = Math.max(1, page - 3);
                let end = Math.min(totalPages, start + 6);
                if (end - start < 6) start = Math.max(1, end - 6);
                if (start > 1) {
                  pages.push(<button key={1} className="page-btn" onClick={() => setPage(1)}>1</button>);
                  if (start > 2) pages.push(<span key="s1" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>);
                }
                for (let pg = start; pg <= end; pg++) {
                  pages.push(
                    <button key={pg} className={`page-btn ${page === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                  );
                }
                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<span key="s2" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>);
                  pages.push(<button key={totalPages} className="page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>);
                }
                return pages;
              })()}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Employee" onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Employee'}
            </button>
          </>}>
          <div className="form-grid">
            <div className="form-row">
              <label>Employee ID</label>
              <input className="input" placeholder="e.g. 12345678"
                value={form.employee_id}
                onChange={e => setForm(prev => ({ ...prev, employee_id: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Full Name</label>
              <input className="input" placeholder="Full name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Category</label>
              <select className="select" value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Region</label>
              <select className="select" value={form.region}
                onChange={e => setForm(prev => ({ ...prev, region: e.target.value, state: STATES[e.target.value][0] }))}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>State</label>
              <select className="select" value={form.state}
                onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}>
                {(STATES[form.region] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Password</label>
              <PwdInput placeholder="Set password" value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editEmp && (
        <Modal title={`Edit: ${editEmp.name}`} onClose={() => setEditEmp(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setEditEmp(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </>}>
          <div style={{ padding: '6px 12px', background: 'var(--border-light)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            <i className="ti ti-id" style={{ marginRight: 6 }} />{editEmp.employee_id}
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Full Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Category</label>
              <select className="select" value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Region</label>
              <select className="select" value={form.region}
                onChange={e => setForm(prev => ({ ...prev, region: e.target.value, state: STATES[e.target.value][0] }))}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>State</label>
              <select className="select" value={form.state}
                onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}>
                {(STATES[form.region] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>New Password (leave blank to keep)</label>
              <PwdInput placeholder="Leave blank to keep current" value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Deactivate Employee" onClose={() => setDeleteConfirm(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.employee_id)}>
              Deactivate
            </button>
          </>}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Are you sure you want to deactivate <strong>{deleteConfirm.name}</strong> ({deleteConfirm.employee_id})?
            They will no longer be able to log in.
          </p>
        </Modal>
      )}
    </div>
  );
}