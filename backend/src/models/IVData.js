import mongoose from 'mongoose';

const ivDataSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.Mixed, index: true }, // String or ObjectId
    rate: { type: Number, default: 0 },
    remaining: { type: Number, default: 500 },
    valveOpen: { type: Boolean, default: true },
    backflow: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model('IVData', ivDataSchema);
