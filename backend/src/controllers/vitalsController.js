import mongoose from 'mongoose';
import Vitals from '../models/Vitals.js';
import { emitVitalsNew } from '../sockets/index.js';
import { evaluate } from '../services/alertService.js';

/** In-memory vitals ring buffer (simulation mode) */
const _memVitals = [];
const MEM_LIMIT = 500;

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function makeMockVital(data) {
  return {
    _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    heartRate: data.heartRate,
    spo2: data.spo2,
    ivStatus: data.ivStatus,
    patientId: data.patientId || null,
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
  };
}

export async function createVitals(req) {
  const { heartRate, spo2, ivStatus, timestamp, patientId } = req.body;

  // Basic validation (PRD FR-V02, FR-V03, FR-V04)
  if (heartRate === undefined || spo2 === undefined || !ivStatus) {
    throw Object.assign(new Error('heartRate, spo2, and ivStatus are required'), { status: 422 });
  }
  if (typeof heartRate !== 'number' || heartRate < 0 || heartRate > 300) {
    throw Object.assign(new Error('heartRate must be a number between 0 and 300'), { status: 422 });
  }
  if (typeof spo2 !== 'number' || spo2 < 0 || spo2 > 100) {
    throw Object.assign(new Error('spo2 must be a number between 0 and 100'), { status: 422 });
  }
  if (!['running', 'stopped'].includes(ivStatus)) {
    throw Object.assign(new Error('ivStatus must be "running" or "stopped"'), { status: 422 });
  }

  if (!isMongoConnected()) {
    const vitals = makeMockVital({ heartRate, spo2, ivStatus, timestamp, patientId });
    _memVitals.unshift(vitals);
    if (_memVitals.length > MEM_LIMIT) _memVitals.splice(MEM_LIMIT);
    emitVitalsNew(req.app.locals.io, vitals);
    evaluate(req.app.locals.io, { ...vitals, patientId }).catch(() => {});
    return vitals;
  }

  const vitals = await Vitals.create({ heartRate, spo2, ivStatus, timestamp: timestamp ? new Date(timestamp) : new Date(), patientId });
  emitVitalsNew(req.app.locals.io, vitals);
  // Async alert evaluation (non-blocking)
  evaluate(req.app.locals.io, { ...vitals.toObject(), patientId }).catch(() => {});
  return vitals;
}

export async function getLatestVitals(patientId) {
  if (!isMongoConnected()) {
    const filtered = patientId ? _memVitals.filter(v => String(v.patientId) === String(patientId)) : _memVitals;
    return filtered[0] || null;
  }
  const filter = patientId ? { patientId } : {};
  return Vitals.findOne(filter).sort({ timestamp: -1 });
}

export async function getVitalsHistory(patientId, limitQuery) {
  const parsedLimit = Number.parseInt(limitQuery, 10);
  const limit = Number.isNaN(parsedLimit) ? 100 : Math.max(1, Math.min(parsedLimit, 1000));

  if (!isMongoConnected()) {
    const filtered = patientId ? _memVitals.filter(v => String(v.patientId) === String(patientId)) : _memVitals;
    return filtered.slice(0, limit);
  }

  const filter = patientId ? { patientId } : {};
  return Vitals.find(filter).sort({ timestamp: -1 }).limit(limit);
}
