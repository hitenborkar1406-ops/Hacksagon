import mongoose from 'mongoose';

const PatientAccessSchema = new mongoose.Schema({
  patientId:      { type: String, required: true },
  patientName:    { type: String, required: true },
  bedNumber:      { type: String, required: true },
  accessCode:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  plan:           { type: String, required: true, enum: ['basic', 'premium'] },
  issuedBy:       { type: String, default: '' },
  issuedAt:       { type: Date, default: Date.now },
  expiresAt:      { type: Date, default: null },
  isActive:       { type: Boolean, default: true },
  lastAccessedAt: { type: Date, default: null },
});

export default mongoose.model('PatientAccess', PatientAccessSchema);
