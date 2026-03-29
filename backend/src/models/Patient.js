import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bedNumber: { type: String, required: true },
    age: { type: Number, required: true },
    ward: { type: String, default: 'Ward 3B' },
    condition: { type: String, enum: ['Stable', 'Watch', 'Critical'], default: 'Stable' },
    prescribedRate: { type: Number, default: 45 },
    assignedDoctor: { type: String, default: 'Dr. Anjali Mehta' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model('Patient', patientSchema);
