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
  North: ['Delhi', 'Haryana', 'Punjab', 'Kashmir', 'Rajasthan', 'Jammu', 'Uttar Pradesh (East)', 'Uttar Pradesh (West)', 'Himachal Pradesh', 'Uttarakhand'],
  South: ['Andhra Pradesh', 'Telangana', 'Kerala', 'Tamil Nadu', 'Karnataka'],
  West: ['MP & CG', 'Mumbai', 'Mah & Goa', 'Gujarat'],
  East: ['Assam', 'Kolkata', 'West Bengal', 'Jharkhand', 'Bihar', 'Orissa', 'North East'],
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const medals = ['🥇','🥈','🥉'];
const rankColors = ['var(--gold-bg)','var(--silver-bg)','var(--bronze-bg)'];
const rankBorders = ['var(--gold-border)','var(--silver-border)','var(--bronze-border)'];

function getCurrentWeekOfMonth() {
  const day = new Date().getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function getWeekDateRange(weekOfMonth, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const starts = [1, 8, 15, 22];
  const ends = [7, 14, 21, daysInMonth];
  return `${starts[weekOfMonth-1]}–${ends[weekOfMonth-1]} ${MONTH_NAMES[month-1]}`;
}

export default function Rankings() {
  const now = new Date();
  const [scope, setScope] = useState('national');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('North');
  const [state, setState] = useState('Delhi');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  // View mode: week or month
  const [viewMode, setViewMode] = useState('week');
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOfMonth());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Month options — last 6 months
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { label: `${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`, month: d.getMonth() + 1, year: d.getFullYear() };
  });

  // Week options for selected month
  const currentWeekOfMonth = getCurrentWeekOfMonth();
  const weekOptions = [1, 2, 3, 4].map(w => ({
    value: w,
    label: getWeekDateRange(w, selectedMonth, selectedYear),
  })).filter(w => {
    const cm = now.getMonth() + 1;
    const cy = now.getFullYear();
    if (selectedYear < cy) return true;
    if (selectedYear === cy && selectedMonth < cm) return true;
    if (selectedYear === cy && selectedMonth === cm) return w.value <= currentWeekOfMonth;
    return false;
  });

  const currentPeriodLabel = viewMode === 'week'
    ? getWeekDateRange(selectedWeek, selectedMonth, selectedYear)
    : `${FULL_MONTHS[selectedMonth - 1]} ${selectedYear}`;

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const params = {
        scope, category,
        mode: viewMode,
        month: selectedMonth,
        year: selectedYear,
        ...(viewMode === 'week' ? { week: selectedWeek } : {})
      };
      if (scope === 'regional') params.region = region;
      if (scope === 'state') params.state = state;
      const res = await api.get('/admin/rankings', { params });
      setRankings(res.data.rankings || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRankings(); }, [scope, category, region, state, viewMode, selectedWeek, selectedMonth, selectedYear]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rankings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
          View leaderboards across all scopes and categories
        </p>
      </div>

      {/* Scope tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SCOPES.map(s => (
          <button key={s.id} onClick={() => setScope(s.id)}
            className={`btn ${scope === s.id ? 'btn-primary' : 'btn-secondary'}`}>
            <i className={`ti ${s.icon}`} /> {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Week / Month toggle */}
          <div>
            <label>View</label>
            <div style={{ display: 'flex', background: '#EAECF0', borderRadius: 8, padding: 3, width: 'fit-content' }}>
              {['week', 'month'].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  background: viewMode === m ? '#fff' : 'transparent',
                  color: viewMode === m ? 'var(--jio-blue)' : 'var(--text-muted)',
                  boxShadow: viewMode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {m === 'week' ? '📅 Weekly' : '🗓️ Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Month selector */}
          <div>
            <label>Month</label>
            <select className="select" style={{ width: 160 }} value={`${selectedMonth}-${selectedYear}`}
              onChange={e => {
                const [m, y] = e.target.value.split('-');
                setSelectedMonth(parseInt(m));
                setSelectedYear(parseInt(y));
                setSelectedWeek(1);
              }}>
              {monthOptions.map(m => (
                <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Week selector (only in week mode) */}
          {viewMode === 'week' && (
            <div>
              <label>Week</label>
              <select className="select" style={{ width: 160 }} value={selectedWeek}
                onChange={e => setSelectedWeek(parseInt(e.target.value))}>
                {weekOptions.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label>Category</label>
            <select className="select" style={{ width: 140 }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {scope === 'regional' && (
            <div>
              <label>Region</label>
              <select className="select" style={{ width: 140 }} value={region} onChange={e => setRegion(e.target.value)}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}

          {scope === 'state' && (
            <>
              <div>
                <label>Region</label>
                <select className="select" style={{ width: 130 }} value={region}
                  onChange={e => { setRegion(e.target.value); setState((STATES[e.target.value] || [])[0] || ''); }}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label>State</label>
                <select className="select" style={{ width: 160 }} value={state} onChange={e => setState(e.target.value)}>
                  {(STATES[region] || []).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
            <span className="badge badge-blue">{currentPeriodLabel}</span>
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Top 10 performers · {currentPeriodLabel}
            </p>
          </div>
          <span className="badge badge-gray">{rankings.length} entries</span>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /> Loading rankings…</div>
        ) : rankings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="ti ti-trophy-off" style={{ fontSize: 40, opacity: 0.3 }} />
            <div style={{ marginTop: 12 }}>No data for {currentPeriodLabel}</div>
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
                <div style={{ minWidth: 36, textAlign: 'center' }}>
                  {i < 3
                    ? <span style={{ fontSize: 22 }}>{medals[i]}</span>
                    : <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>#{emp.rank}</span>
                  }
                </div>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--jio-blue)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600
                }}>
                  {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {emp.employee_id}{emp.region && ` · ${emp.region}`}{emp.state && ` · ${emp.state}`}
                  </div>
                </div>
                <span className={`badge ${emp.category === 'CSL' ? 'badge-blue' : 'badge-teal'}`} style={{ flexShrink: 0 }}>
                  {emp.category}
                </span>
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