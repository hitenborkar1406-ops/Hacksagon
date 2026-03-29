import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { MOCK_PATIENTS } from '../utils/formatVitals';

const EVENT_TYPES = ['ALL', 'SPO2_LOW', 'HR_ABNORMAL', 'IV_STOPPED', 'BACKFLOW', 'VALVE_CHANGE', 'FLOW_CHANGE'];

// Generate mock log data
const MOCK_LOGS = Array.from({ length: 50 }, (_, i) => {
  const patient = MOCK_PATIENTS[i % MOCK_PATIENTS.length];
  const types = ['SPO2_LOW', 'HR_ABNORMAL', 'IV_STOPPED', 'BACKFLOW', 'VALVE_CHANGE', 'FLOW_CHANGE', 'STABLE'];
  const type = types[Math.floor(Math.random() * types.length)];
  const isOk = type === 'STABLE' || type === 'VALVE_CHANGE' || type === 'FLOW_CHANGE';
  const ts = new Date(Date.now() - i * 180000).toISOString();
  return {
    id: `log-${i}`,
    ts,
    patientId: patient.patientId,
    room: patient.room,
    type,
    value: type === 'SPO2_LOW' ? `${(88 + Math.random() * 5).toFixed(1)}%`
      : type === 'HR_ABNORMAL' ? `${Math.round(110 + Math.random() * 30)} BPM`
      : type === 'FLOW_CHANGE' ? `${Math.round(20 + Math.random() * 60)} mL/hr`
      : type === 'VALVE_CHANGE' ? (Math.random() > 0.5 ? 'OPEN' : 'CLOSED')
      : '--',
    threshold: type === 'SPO2_LOW' ? '< 90%' : type === 'HR_ABNORMAL' ? '> 100 BPM' : '--',
    status: isOk ? 'OK' : Math.random() > 0.3 ? 'CRITICAL' : 'WARNING',
  };
});

const PER_PAGE = 10;

export default function Logs() {
  const [filterPatient, setFilterPatient] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [page, setPage] = useState(1);

  const filtered = MOCK_LOGS.filter((l) =>
    (filterPatient === 'ALL' || l.patientId === filterPatient) &&
    (filterType === 'ALL' || l.type === filterType)
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function exportCSV() {
    const headers = ['Timestamp', 'Patient', 'Room', 'Event Type', 'Value', 'Threshold', 'Status'];
    const rows = filtered.map((l) => [new Date(l.ts).toLocaleString(), l.patientId, l.room, l.type, l.value, l.threshold, l.status]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'smartiv_logs.csv'; a.click();
  }

  const statusClass = (s) => s === 'OK' ? 'log-status-ok' : s === 'CRITICAL' ? 'log-status-crit' : 'log-status-warn';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar title="HISTORY LOGS" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <div className="page-heading">EVENT LOGS</div>
              <div className="page-subhead">{filtered.length} records · Paginated</div>
            </div>
          </div>

          <div className="card">
            {/* Filters */}
            <div className="filters-bar">
              <select className="filter-select" value={filterPatient} onChange={(e) => { setFilterPatient(e.target.value); setPage(1); }}>
                <option value="ALL">All Patients</option>
                {MOCK_PATIENTS.map((p) => <option key={p.patientId} value={p.patientId}>{p.patientId} — {p.name}</option>)}
              </select>
              <select className="filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="btn-export" onClick={exportCSV}>EXPORT CSV ↓</button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>PATIENT</th>
                    <th>ROOM</th>
                    <th>EVENT TYPE</th>
                    <th>VALUE</th>
                    <th>THRESHOLD</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((l) => (
                    <tr key={l.id}>
                      <td>{new Date(l.ts).toLocaleTimeString()}</td>
                      <td className="log-patient-id">{l.patientId}</td>
                      <td>{l.room}</td>
                      <td>{l.type}</td>
                      <td className="log-value">{l.value}</td>
                      <td>{l.threshold}</td>
                      <td className={statusClass(l.status)}>{l.status}</td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No records match filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← PREV</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} className={`page-btn ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                );
              })}
              <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>NEXT →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
