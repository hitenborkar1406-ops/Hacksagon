/**
 * IoT Simulator Service
 * Generates realistic patient vitals + IV data every 3 seconds per patient.
 * Random walks with occasional anomalies so data feels real.
 */
import Vitals from '../models/Vitals.js';
import { evaluate } from './alertService.js';
import { emitVitalsNew, emitIVUpdate } from '../sockets/index.js';

// In-memory IV state per patient (patientId → state obj)
const ivState = new Map();

// In-memory vitals buffer for when MongoDB is unavailable
const vitalsBuffer = new Map();

// Patient baselines — seeded from Patient list
let activePatients = [];

function initPatient(patient) {
  const id = patient._id.toString();
  if (ivState.has(id)) return;
  ivState.set(id, {
    remaining: 500,
    valveOpen: true,
    backflow: false,
    backflowTimer: 0,
    prescribedRate: patient.prescribedRate || 45,
  });
}

export function registerPatients(patients) {
  activePatients = patients;
  patients.forEach(initPatient);
}

function randomWalk(current, step, min, max) {
  const delta = (Math.random() - 0.5) * 2 * step;
  return Math.max(min, Math.min(max, current + delta));
}

// Per-patient HR baselines (range 60-90 for simulated patients)
const hrBaseline = new Map();
const spo2Baseline = new Map();

function getBaseline(patientId, map, defaultMin, defaultMax) {
  if (!map.has(patientId)) {
    map.set(patientId, defaultMin + Math.random() * (defaultMax - defaultMin));
  }
  return map.get(patientId);
}

async function tick(io) {
  for (const patient of activePatients) {
    const id = patient._id.toString();
    const iv = ivState.get(id);
    if (!iv) continue;

    const hrBase = getBaseline(id, hrBaseline, 62, 88);
    const spo2Base = getBaseline(id, spo2Baseline, 95, 99);

    // Get last buffered value or fall back to baseline
    const last = vitalsBuffer.get(id) || { heartRate: hrBase, spo2: spo2Base };

    // 3% chance of heart rate spike event
    const spike = Math.random() < 0.03;
    const newHr = spike
      ? hrBase + 20 + Math.random() * 15
      : randomWalk(last.heartRate, 2, 40, 120);

    // 1% chance of SpO2 dip
    const dip = Math.random() < 0.01;
    const newSpo2 = dip
      ? Math.max(88, last.spo2 - 3 - Math.random() * 3)
      : randomWalk(last.spo2, 0.5, 88, 100);

    // Backflow: 2% chance per tick, auto-resolves after 8 seconds (~3 ticks)
    if (!iv.backflow && Math.random() < 0.02) {
      iv.backflow = true;
      iv.backflowTimer = 3;
      iv.valveOpen = false; // auto-close
    }
    if (iv.backflow) {
      iv.backflowTimer--;
      if (iv.backflowTimer <= 0) {
        iv.backflow = false;
        iv.valveOpen = true;
      }
    }

    // IV remaining decrements by prescribedRate/1200 mL per 3s tick
    const drainRate = iv.valveOpen && !iv.backflow ? iv.prescribedRate / 1200 : 0;
    iv.remaining = Math.max(0, iv.remaining - drainRate * 3);
    if (iv.remaining <= 0) iv.valveOpen = false;

    const vitalsData = {
      patientId: id,
      heartRate: parseFloat(newHr.toFixed(1)),
      spo2: parseFloat(newSpo2.toFixed(1)),
      ivStatus: iv.valveOpen ? 'running' : 'stopped',
      backflow: iv.backflow,
      ivRemaining: parseFloat(iv.remaining.toFixed(1)),
      ivRate: iv.valveOpen ? iv.prescribedRate : 0,
      valveOpen: iv.valveOpen,
      timestamp: new Date(),
    };

    vitalsBuffer.set(id, vitalsData);

    // Persist to MongoDB (non-blocking — don't await)
    Vitals.create({
      heartRate: vitalsData.heartRate,
      spo2: vitalsData.spo2,
      ivStatus: vitalsData.ivStatus,
      timestamp: vitalsData.timestamp,
      patientId: id,
    }).catch(() => {}); // graceful: might fail if in-memory mode

    // Emit real-time updates
    emitVitalsNew(io, vitalsData);
    emitIVUpdate(io, {
      patientId: id,
      remaining: iv.remaining,
      valveOpen: iv.valveOpen,
      backflow: iv.backflow,
      rate: iv.valveOpen ? iv.prescribedRate : 0,
    });

    // Alert engine (non-blocking)
    evaluate(io, vitalsData).catch(() => {});
  }
}

let intervalHandle = null;

export function startSimulator(io) {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => tick(io), 3000);
  console.log('Simulator running — generating vitals every 3s per patient');
}

export function stopSimulator() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}

/** Return latest in-memory IV state for a patient */
export function getIVState(patientId) {
  return ivState.get(patientId) || null;
}

/** Toggle valve for a patient — called by valve control route */
export function setValve(patientId, open) {
  const iv = ivState.get(patientId);
  if (iv) iv.valveOpen = open;
  return iv;
}
