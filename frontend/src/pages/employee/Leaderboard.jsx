import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import JIO_LOGO from '../../utils/jioLogo';

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_STYLE = [
  { bg: '#FFFBF0', border: '#F0D98C' },
  { bg: '#F4F5F7', border: '#C5CDD6' },
  { bg: '#FDF5F2', border: '#DDB8A8' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  return `${starts[weekOfMonth-1]}–${ends[weekOfMonth-1]} ${MONTH_SHORT[month-1]}`;
}

export default function Leaderboard() {
  const { scope } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [viewMode, setViewMode] = useState('week');
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOfMonth());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagline, setTagline] = useState('Outperform Your Yesterday');
  const [logoUrl, setLogoUrl] = useState('');

  const scopeLabel = scope === 'national' ? 'National' : scope === 'regional' ? 'Regional' : 'State';
  const scopeSub = scope === 'national' ? 'All India' : scope === 'regional' ? (user?.region || '') + ' Region' : user?.state;

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentWeekOfMonth = getCurrentWeekOfMonth();

  const weekOptions = [1, 2, 3, 4].map(w => ({
    value: w,
    label: getWeekDateRange(w, selectedMonth, selectedYear),
  })).filter(w => {
    if (selectedYear < currentYear) return true;
    if (selectedYear === currentYear && selectedMonth < currentMonth) return true;
    if (selectedYear === currentYear && selectedMonth === currentMonth) return w.value <= currentWeekOfMonth;
    return false;
  });

  useEffect(() => {
    api.get('/employee/settings').then(r => {
      setTagline(r.data.tagline || 'Outperform Your Yesterday');
      setLogoUrl(r.data.logo_url || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      mode: viewMode,
      month: selectedMonth,
      year: selectedYear,
      ...(viewMode === 'week' ? { week: selectedWeek } : {})
    };
    api.get('/employee/rankings/' + scope, { params })
      .then(r => setData(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [scope, viewMode, selectedWeek, selectedMonth, selectedYear]);

  const rankings = data?.rankings || [];
  const my = data?.myRank || {};

  const currentPeriodLabel = viewMode === 'week'
    ? getWeekDateRange(selectedWeek, selectedMonth, selectedYear)
    : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const PillBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: '5px 14px',
      borderRadius: 20,
      border: 'none',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: active ? 700 : 400,
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      background: active ? '#fff' : 'rgba(255,255,255,0.12)',
      color: active ? 'var(--jio-blue)' : 'rgba(255,255,255,0.8)',
      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
    }}>
      {children}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--jio-blue-dark) 0%, var(--jio-blue) 100%)',
        paddingBottom: 18,
        boxShadow: '0 4px 20px rgba(9,27,90,0.35)',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 0' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            width: 36, height: 36, borderRadius: 9,
            cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="ti ti-arrow-left" />
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {scopeSub}
            </div>
            <div style={{ color: '#fff', fontSize: 19, fontWeight: 700, marginTop: 1, letterSpacing: '-0.3px' }}>
              {scopeLabel} Rankings
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          padding: '10px 18px 0',
          fontSize: 13, fontStyle: 'italic', fontWeight: 500,
          color: 'rgba(255,255,255,0.6)',
          transform: 'rotate(-0.5deg)',
          transformOrigin: 'left center',
        }}>
          "{tagline}"
        </div>

        {/* Controls */}
        <div style={{ padding: '14px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Week / Month toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, width: 'fit-content', gap: 2 }}>
            {['week', 'month'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '6px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
                background: viewMode === m ? '#fff' : 'transparent',
                color: viewMode === m ? 'var(--jio-blue)' : 'rgba(255,255,255,0.7)',
              }}>
                {m === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Month pills */}
          {viewMode === 'month' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {monthOptions.map(m => (
                <PillBtn key={`${m.month}-${m.year}`}
                  active={selectedMonth === m.month && selectedYear === m.year}
                  onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); }}>
                  {m.label}
                </PillBtn>
              ))}
            </div>
          )}

          {viewMode === 'week' && (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {monthOptions.slice(0, 3).map(m => (
                  <PillBtn key={`${m.month}-${m.year}`}
                    active={selectedMonth === m.month && selectedYear === m.year}
                    onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); setSelectedWeek(1); }}>
                    {m.label}
                  </PillBtn>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {weekOptions.map(w => (
                  <PillBtn key={w.value}
                    active={selectedWeek === w.value}
                    onClick={() => setSelectedWeek(w.value)}>
                    {w.label}
                  </PillBtn>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 14px 0' }}>

        {/* Period + category badge bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px',
          background: 'var(--bg-card)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          marginBottom: 14,
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-calendar" style={{ color: 'var(--jio-blue)', fontSize: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--jio-blue)' }}>{currentPeriodLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="badge badge-blue">{user?.category}</span>
            <span className="badge badge-teal">{scopeLabel}</span>
          </div>
        </div>

        {/* Rankings list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading rankings…</div>
          </div>
        ) : rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)' }}>
            <i className="ti ti-trophy-off" style={{ fontSize: 44, opacity: 0.25, display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>No data for {currentPeriodLabel}</div>
          </div>
        ) : rankings.map((emp, i) => {
          const isMe = emp.employee_id === user?.employee_id;
          const rs = i < 3 ? RANK_STYLE[i] : null;
          const locationText = [emp.region, emp.state].filter(Boolean).join(' · ');
          const subtitleText = isMe ? [emp.employee_id, locationText].filter(Boolean).join(' · ') : locationText;

          return (
            <div key={emp.employee_id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 12,
              marginBottom: 8,
              background: isMe
                ? 'linear-gradient(135deg, var(--jio-blue-dark), var(--jio-blue))'
                : rs ? rs.bg : 'var(--bg-card)',
              border: `1px solid ${isMe ? 'transparent' : rs ? rs.border : 'var(--border)'}`,
              boxShadow: isMe
                ? '0 4px 20px rgba(15,60,201,0.3)'
                : 'var(--shadow)',
              transition: 'box-shadow 0.15s',
            }}>
              <div style={{ minWidth: 32, textAlign: 'center', flexShrink: 0 }}>
                {i < 3
                  ? <span style={{ fontSize: 22 }}>{MEDAL[i]}</span>
                  : <span style={{ fontSize: 15, fontWeight: 700, color: isMe ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)' }}>
                      #{emp.rank}
                    </span>
                }
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--jio-blue)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14,
                  color: isMe ? '#fff' : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                }}>
                  {emp.name}
                  {isMe && (
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: 20, color: '#fff' }}>
                      You
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                    background: isMe ? 'rgba(255,255,255,0.15)' : (emp.category === 'CSL' ? 'var(--jio-blue-light)' : 'var(--jio-teal-light)'),
                    color: isMe ? '#fff' : (emp.category === 'CSL' ? 'var(--jio-blue)' : '#0077A8'),
                  }}>
                    {emp.category}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, marginTop: 2,
                  color: isMe ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {subtitleText}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: isMe ? '#fff' : 'var(--jio-blue)' }}>
                  {emp.points?.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)' }}>
                  installs
                </div>
              </div>
            </div>
          );
        })}

        {/* Your performance card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--jio-blue-dark) 0%, var(--jio-blue) 100%)',
          borderRadius: 16, padding: '18px 20px', color: '#fff', marginTop: 16,
          boxShadow: '0 8px 24px rgba(15,60,201,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, paddingBottom: 14,
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                {user?.employee_id} · {user?.category} · {scopeLabel} · {currentPeriodLabel}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
            Your Performance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Your Rank',    value: my.rank ? '#' + my.rank : '—' },
              { label: 'Installations', value: my.points ? my.points.toLocaleString() : '0' },
              { label: 'Position',     value: my.percentile != null ? 'Top ' + (100 - my.percentile) + '%' : '—' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
