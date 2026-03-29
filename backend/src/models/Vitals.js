import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema(
  {
    patientId: { type: String, index: true },
    heartRate: { type: Number, required: true, min: 0, max: 300 },
    spo2: { type: Number, required: true, min: 0, max: 100 },
    ivStatus: { type: String, enum: ['running', 'stopped'], required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.model('Vitals', vitalsSchema);
