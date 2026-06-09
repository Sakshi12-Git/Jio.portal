import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import JIO_LOGO from '../../utils/jioLogo';

const MEDAL = ['🥇','🥈','🥉'];
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
  const scopeSub = scope === 'national' ? 'All India' : scope === 'regional' ? user?.region + ' Region' : user?.state;

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ background: 'var(--jio-blue)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 0' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="ti ti-arrow-left" />
          </button>
          <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', padding: 2, flexShrink: 0, objectFit: 'contain' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{scopeSub}</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 1 }}>{scopeLabel} Rankings</div>
          </div>
        </div>

        <div style={{ padding: '10px 18px 0', fontStyle: 'italic', fontWeight: 500, fontSize: 14, color: 'rgba(255,255,255,0.7)', transform: 'rotate(-1deg)', transformOrigin: 'left center' }}>
          "{tagline}"
        </div>

        <div style={{ padding: '14px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
            {['week', 'month'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                background: viewMode === m ? '#fff' : 'transparent',
                color: viewMode === m ? 'var(--jio-blue)' : 'rgba(255,255,255,0.7)',
              }}>
                {m === 'week' ? '📅 Weekly' : '🗓️ Monthly'}
              </button>
            ))}
          </div>

          {viewMode === 'month' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {monthOptions.map(m => (
                <button key={`${m.month}-${m.year}`}
                  onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); }}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                    background: selectedMonth === m.month && selectedYear === m.year ? '#fff' : 'rgba(255,255,255,0.12)',
                    color: selectedMonth === m.month && selectedYear === m.year ? 'var(--jio-blue)' : 'rgba(255,255,255,0.8)',
                    boxShadow: selectedMonth === m.month && selectedYear === m.year ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'week' && (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {monthOptions.slice(0, 3).map(m => (
                  <button key={`${m.month}-${m.year}`}
                    onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); setSelectedWeek(1); }}
                    style={{
                      padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontSize: 12, transition: 'all 0.15s',
                      background: selectedMonth === m.month && selectedYear === m.year ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: selectedMonth === m.month && selectedYear === m.year ? 700 : 400,
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {weekOptions.map(w => (
                  <button key={w.value} onClick={() => setSelectedWeek(w.value)} style={{
                    padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                    background: selectedWeek === w.value ? '#fff' : 'rgba(255,255,255,0.12)',
                    color: selectedWeek === w.value ? 'var(--jio-blue)' : 'rgba(255,255,255,0.8)',
                    boxShadow: selectedWeek === w.value ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}>
                    {w.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Period label bar */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 14px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'var(--bg-card)',
          borderRadius: 10, border: '1px solid var(--border)', marginBottom: 12
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
            <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>Loading rankings…</div>
          </div>
        ) : rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <i className="ti ti-trophy-off" style={{ fontSize: 40, opacity: 0.3 }} />
            <div style={{ marginTop: 12, fontSize: 14 }}>No data for {currentPeriodLabel}</div>
          </div>
        ) : rankings.map((emp, i) => {
          const isMe = emp.employee_id === user?.employee_id;
          const rs = i < 3 ? RANK_STYLE[i] : null;
          const locationParts = [emp.region, emp.state].filter(Boolean);
          const locationText = locationParts.join(' · ');
          const subtitleText = isMe ? [emp.employee_id, locationText].filter(Boolean).join(' · ') : locationText;

          return (
            <div key={emp.employee_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12, marginBottom: 8,
              background: isMe ? 'linear-gradient(135deg, #002070, #003fa8)' : rs ? rs.bg : 'var(--bg-card)',
              border: `1px solid ${isMe ? 'transparent' : rs ? rs.border : 'var(--border)'}`,
              boxShadow: isMe ? '0 4px 16px rgba(0,32,112,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ minWidth: 32, textAlign: 'center' }}>
                {i < 3
                  ? <span style={{ fontSize: 22 }}>{MEDAL[i]}</span>
                  : <span style={{ fontSize: 15, fontWeight: 700, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>#{emp.rank}</span>
                }
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--jio-blue)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700
              }}>
                {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: isMe ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {emp.name}
                  {isMe && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: 10 }}>You</span>}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                    background: isMe ? 'rgba(255,255,255,0.15)' : emp.category === 'CSL' ? '#EEF2FF' : '#e6f7fc',
                    color: isMe ? '#fff' : emp.category === 'CSL' ? 'var(--jio-blue)' : 'var(--jio-teal)'
                  }}>
                    {emp.category}
                  </span>
                </div>
                <div style={{ fontSize: 11, marginTop: 1, color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {subtitleText}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: isMe ? '#fff' : 'var(--jio-blue)' }}>
                  {emp.points?.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>installs</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your Performance card */}
      <div style={{ maxWidth: 520, margin: '16px auto 0', padding: '0 14px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #002070 0%, #003fa8 100%)',
          borderRadius: 14, padding: '16px 18px', color: '#fff',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 14, paddingBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.12)'
          }}>
            <img src={logoUrl || JIO_LOGO} alt="Jio" style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', padding: 2, flexShrink: 0, objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>
                {user?.employee_id} · {user?.category} · {scopeLabel} · {currentPeriodLabel}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            Your Performance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{my.rank ? '#' + my.rank : '—'}</div>
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>Your Rank</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{my.points ? my.points.toLocaleString() : '0'}</div>
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>Installations</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{my.percentile != null ? 'Top ' + (100 - my.percentile) + '%' : '—'}</div>
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>Position</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}