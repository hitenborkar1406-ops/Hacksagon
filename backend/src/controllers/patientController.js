import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import Vitals from '../models/Vitals.js';
import { getIVState } from '../services/simulatorService.js';

const SEED_PATIENTS_DATA = [
  { name: 'Rahul Sharma', bedNumber: 'Bed 4A', age: 42, condition: 'Stable' },
  { name: 'Meena Patel',  bedNumber: 'Bed 4B', age: 67, condition: 'Watch' },
  { name: 'Arjun Kumar',  bedNumber: 'Bed 5A', age: 31, condition: 'Critical' },
  { name: 'Sunita Rao',   bedNumber: 'Bed 5B', age: 55, condition: 'Stable' },
  { name: 'Vikram Desai', bedNumber: 'Bed 6A', age: 48, condition: 'Stable' },
  { name: 'Priya Nair',   bedNumber: 'Bed 6B', age: 38, condition: 'Watch' },
];

/** In-memory patient store (used when MongoDB is unavailable) */
let _memPatients = null;

function getMemPatients() {
  if (!_memPatients) {
    _memPatients = SEED_PATIENTS_DATA.map((p, i) => ({
      _id: `p${i + 1}`,
      ...p,
      ward: 'Ward 3B',
      assignedDoctor: 'Dr. Anjali Mehta',
      prescribedRate: 45,
      createdAt: new Date(),
    }));
  }
  return _memPatients;
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/** Seed 6 patients if collection is empty. Returns patient list. */
export async function seedPatients() {
  if (!isMongoConnected()) {
    return getMemPatients();
  }
  const count = await Patient.countDocuments();
  if (count > 0) return Patient.find();
  const patients = await Patient.insertMany(
    SEED_PATIENTS_DATA.map(p => ({
      ...p,
      ward: 'Ward 3B',
      assignedDoctor: 'Dr. Anjali Mehta',
      prescribedRate: 45,
    }))
  );
  console.log(`Seeded ${patients.length} patients`);
  return patients;
}

export async function getAllPatients() {
  if (!isMongoConnected()) return getMemPatients();
  return Patient.find().sort({ bedNumber: 1 });
}

export async function getPatientById(id) {
  if (!isMongoConnected()) {
    return getMemPatients().find(p => p._id === id) || null;
  }
  return Patient.findById(id);
}

export async function getPatientLatestVitals(patientId, limit = 30) {
  if (!isMongoConnected()) return [];
  const lim = Math.max(1, Math.min(Number(limit) || 30, 100));
  return Vitals.find({ patientId }).sort({ timestamp: -1 }).limit(lim);
}

export function getPatientIVState(patientId) {
  return getIVState(patientId);
}
