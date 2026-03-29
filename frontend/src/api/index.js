const BASE_URL = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  try {
    const raw = localStorage.getItem('vitaflow_auth');
    if (!raw) return {};
    const { token } = JSON.parse(raw);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ── Patients ─────────────────────────────────────────────────
export const getPatients = () => apiFetch('/api/patients');
export const getPatientById = (id) => apiFetch(`/api/patients/${id}`);

// ── Vitals ───────────────────────────────────────────────────
export const getVitals = (patientId, limit = 30) =>
  apiFetch(`/api/vitals/${patientId}?limit=${limit}`);

// ── IV ───────────────────────────────────────────────────────
export const getIV = (patientId) => apiFetch(`/api/iv/${patientId}`);

// ── Alerts ───────────────────────────────────────────────────
export const getAlerts = (patientId, resolved = false) => {
  const params = new URLSearchParams();
  if (patientId) params.set('patientId', patientId);
  if (!resolved) params.set('resolved', 'false');
  return apiFetch(`/api/alerts?${params.toString()}`);
};

export const resolveAlert = (id) =>
  apiFetch(`/api/alerts/${id}/resolve`, { method: 'POST' });

// ── Control ──────────────────────────────────────────────────
export const controlValve = (patientId, action) =>
  apiFetch('/api/control/valve', {
    method: 'POST',
    body: JSON.stringify({ patientId, action }),
  });

export default { getPatients, getPatientById, getVitals, getIV, getAlerts, resolveAlert, controlValve };
