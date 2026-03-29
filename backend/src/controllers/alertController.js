import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import { emitAlertNew } from '../sockets/index.js';

/** In-memory alert store for simulation mode */
const _memAlerts = [];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export async function listAlerts(query = {}) {
  if (!isMongoConnected()) {
    let alerts = [..._memAlerts];
    if (query.patientId) alerts = alerts.filter(a => a.patientId === query.patientId);
    if (query.severity)  alerts = alerts.filter(a => a.severity  === query.severity);
    if (query.resolved !== 'true') alerts = alerts.filter(a => !a.acknowledged);
    const limit = Math.min(Number(query.limit) || 50, 200);
    return alerts.slice(0, limit);
  }
  const filter = { acknowledged: false };
  if (query.patientId) filter.patientId = query.patientId;
  if (query.severity)  filter.severity  = query.severity;
  if (query.resolved === 'true') delete filter.acknowledged;
  const limit = Math.min(Number(query.limit) || 50, 200);
  return Alert.find(filter).sort({ timestamp: -1 }).limit(limit);
}

export async function resolveAlert(id) {
  if (!isMongoConnected()) {
    const idx = _memAlerts.findIndex(a => a._id === id);
    if (idx === -1) return null;
    _memAlerts[idx].acknowledged = true;
    return _memAlerts[idx];
  }
  return Alert.findByIdAndUpdate(id, { acknowledged: true }, { new: true });
}

export async function createAlert(data, io) {
  if (!isMongoConnected()) {
    const alert = {
      _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...data,
      acknowledged: false,
      timestamp: new Date(),
    };
    _memAlerts.unshift(alert);
    if (_memAlerts.length > 200) _memAlerts.splice(200);
    emitAlertNew(io, alert);
    return alert;
  }
  const alert = await Alert.create(data);
  emitAlertNew(io, alert);
  return alert;
}

/** Expose in-memory store so alertService can push to it */
export { _memAlerts };
