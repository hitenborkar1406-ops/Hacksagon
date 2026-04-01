import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
  {
    heartRate: { type: Number, required: true },
    spo2: { type: Number, required: true },
    ivStatus: { type: String, enum: ["running", "stopped"], required: true },
    // RBAC: vitals belong to exactly one patient
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Optional: device node that produced this vitals record
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceNode" },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Vitals", vitalsSchema);
