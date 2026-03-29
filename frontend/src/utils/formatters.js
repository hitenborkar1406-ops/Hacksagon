/** Format a Date or ISO string as HH:MM:SS */
export function fmtTime(ts) {
  if (!ts) return '--:--:--';
  return new Date(ts).toLocaleTimeString('en-IN', { hour12: false });
}

/** Format a Date or ISO string as HH:MM */
export function fmtTimeShort(ts) {
  if (!ts) return '--:--';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Relative time label — "2 min ago", "just now" */
export function relativeTime(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
  return new Date(ts).toLocaleDateString();
}

/** Estimated IV completion time string: "3h 22m" */
export function estCompletion(remaining, ratePerHr) {
  if (!ratePerHr || ratePerHr <= 0) return '—';
  const hours = remaining / ratePerHr;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Percentage 0-100 */
export function pct(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

/** Round to 1 decimal */
export function r1(n) {
  return typeof n === 'number' ? Math.round(n * 10) / 10 : n;
}

/** Severity badge label */
export function severityLabel(s) {
  return { critical: 'CRITICAL', warning: 'WATCH', info: 'INFO', normal: 'NORMAL' }[s] ?? s?.toUpperCase();
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const apiUrl = (path) => `${API}${path}`;
