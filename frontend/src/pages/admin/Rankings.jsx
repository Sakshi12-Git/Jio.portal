import { useEffect, useState } from 'react';
import api from '../../utils/api';

const SCOPES = [
  { id: 'national', label: 'National', icon: 'ti-world' },
  { id: 'regional', label: 'Regional', icon: 'ti-map' },
  { id: 'state',    label: 'State',    icon: 'ti-building-community' },
];
const CATEGORIES = ['', 'CSL', 'XDSS', 'JDSS'];
const REGIONS = ['North', 'South', 'East', 'West'];
const STATES = {
  North: ['Delhi', 'UP', 'Punjab', 'Haryana', 'Himachal Pradesh', 'Uttarakhand'],
  South: ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana'],
  East: ['West Bengal', 'Bihar', 'Odisha', 'Jharkhand', 'Assam'],
  West: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa', 'MP'],
};

const medals = ['🥇', '🥈', '🥉'];
const rankColors = ['var(--gold-bg)', 'var(--silver-bg)', 'var(--bronze-bg)'];
const rankBorders = ['var(--gold-border)', 'var(--silver-border)', 'var(--bronze-border)'];

export default function Rankings() {
  const [scope, setScope] = useState('national');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('North');
  const [state, setState] = useState('Delhi');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({});

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const params = { scope, category };
      if (scope === 'regional') params.region = region;
      if (scope === 'state') params.state = state;
      const res = await api.get('/admin/rankings', { params });
      setRankings(res.data.rankings || []);
      setMeta({ week: res.data.week, year: res.data.year });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRankings(); }, [scope, category, region, state]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rankings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
          View leaderboards across all scopes and categories
        </p>
      </div>

      {/* Scope tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SCOPES.map(s => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`btn ${scope === s.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            <i className={`ti ${s.icon}`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label>Category</label>
            <select className="select" style={{ width: 160 }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {scope === 'regional' && (
            <div>
              <label>Region</label>
              <select className="select" style={{ width: 160 }} value={region} onChange={e => setRegion(e.target.value)}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}
          {scope === 'state' && (
            <>
              <div>
                <label>Region</label>
                <select className="select" style={{ width: 140 }} value={region}
                  onChange={e => { setRegion(e.target.value); setState(STATES[e.target.value][0]); }}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label>State</label>
                <select className="select" style={{ width: 180 }} value={state} onChange={e => setState(e.target.value)}>
                  {(STATES[region] || []).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}
          <div style={{ marginLeft: 'auto', paddingBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
            {meta.week && (
              <span className="badge badge-blue">Week {meta.week}, {meta.year}</span>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              {SCOPES.find(s => s.id === scope)?.label} Rankings
              {scope === 'regional' && ` — ${region}`}
              {scope === 'state' && ` — ${state}`}
              {category && ` · ${category}`}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Top 10 performers</p>
          </div>
          <span className="badge badge-gray">{rankings.length} entries</span>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="spinner" />
            Loading rankings…
          </div>
        ) : rankings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="ti ti-trophy-off" style={{ fontSize: 40, opacity: 0.3 }} />
            <div style={{ marginTop: 12 }}>No ranking data for this combination</div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {rankings.map((emp, i) => (
              <div key={emp.employee_id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 10, marginBottom: 8,
                background: i < 3 ? rankColors[i] : 'var(--border-light)',
                border: `1px solid ${i < 3 ? rankBorders[i] : 'var(--border)'}`,
              }}>
                {/* Rank */}
                <div style={{ minWidth: 36, textAlign: 'center' }}>
                  {i < 3
                    ? <span style={{ fontSize: 22 }}>{medals[i]}</span>
                    : <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>#{emp.rank}</span>
                  }
                </div>

                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--jio-blue)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600
                }}>
                  {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {emp.employee_id}
                    {emp.region && ` · ${emp.region}`}
                    {emp.state && ` · ${emp.state}`}
                  </div>
                </div>

                {/* Category badge */}
                <span className={`badge ${emp.category === 'CSL' ? 'badge-blue' : 'badge-teal'}`} style={{ flexShrink: 0 }}>
                  {emp.category}
                </span>

                {/* Installations */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--jio-blue)' }}>
                    {emp.points?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>installs</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}