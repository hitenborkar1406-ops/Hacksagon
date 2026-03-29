import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    patientId: { type: String, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
    acknowledged: { type: Boolean, default: false, index: true },
    hash: { type: String, unique: true },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model('Alert', alertSchema);
