import crypto from 'crypto';
import Alert from '../models/Alert.js';
import { emitAlertNew } from '../sockets/index.js';

// PRD §15.1 thresholds
const THRESHOLDS = [
  {
    type: 'LOW_SPO2_CRITICAL',
    severity: 'critical',
    check: (v) => v.spo2 < 90,
    message: (v) => `Critical: SpO₂ has dropped to ${v.spo2.toFixed(1)}%. Immediate assessment required.`,
  },
  {
    type: 'LOW_SPO2_WARNING',
    severity: 'warning',
    check: (v) => v.spo2 >= 90 && v.spo2 <= 93,
    message: (v) => `Warning: SpO₂ is ${v.spo2.toFixed(1)}%, below normal range. Monitor closely.`,
  },
  {
    type: 'HIGH_HR',
    severity: 'warning',
    check: (v) => v.heartRate > 120,
    message: (v) => `Warning: Tachycardia detected. Heart rate is ${Math.round(v.heartRate)} bpm.`,
  },
  {
    type: 'LOW_HR',
    severity: 'warning',
    check: (v) => v.heartRate < 50,
    message: (v) => `Warning: Bradycardia detected. Heart rate is ${Math.round(v.heartRate)} bpm.`,
  },
  {
    type: 'IV_STOPPED',
    severity: 'info',
    check: (v) => v.ivStatus === 'stopped',
    message: () => 'IV administration has stopped. Monitor patient for response changes.',
  },
  {
    type: 'BACKFLOW',
    severity: 'critical',
    check: (v) => v.backflow === true,
    message: () => 'Critical: Blood backflow detected in IV line. Solenoid valve auto-closed.',
  },
  {
    type: 'IV_LOW',
    severity: 'warning',
    check: (v) => v.ivRemaining !== undefined && v.ivRemaining < 50 && v.ivRemaining >= 20,
    message: (v) => `Warning: IV bag nearly empty — ${Math.round(v.ivRemaining)} mL remaining.`,
  },
  {
    type: 'IV_CRITICAL',
    severity: 'critical',
    check: (v) => v.ivRemaining !== undefined && v.ivRemaining < 20,
    message: (v) => `Critical: IV bag critically low — ${Math.round(v.ivRemaining)} mL remaining. Replace immediately.`,
  },
];

/**
 * Evaluate thresholds for a vitals + IV reading.
 * Returns new alerts created (may be empty if all deduplicated).
 */
export async function evaluate(io, vitalsData) {
  const results = [];
  const timeBucket = Math.floor(Date.now() / 300_000); // 5-min window

  for (const rule of THRESHOLDS) {
    if (!rule.check(vitalsData)) continue;

    // PRD §15.2 — SHA-256 deduplication
    const hash = crypto
      .createHash('sha256')
      .update(`${rule.type}:${vitalsData.patientId || 'global'}:${timeBucket}`)
      .digest('hex');

    try {
      const existing = await Alert.findOne({ hash });
      if (existing) continue; // suppress duplicate

      const alert = await Alert.create({
        type: rule.type,
        severity: rule.severity,
        message: rule.message(vitalsData),
        hash,
        patientId: vitalsData.patientId || null,
        acknowledged: false,
      });

      emitAlertNew(io, alert);
      results.push(alert);
    } catch (err) {
      // duplicate key error means race condition — safe to ignore
      if (err.code !== 11000) console.error('alertService error:', err.message);
    }
  }

  return results;
}
