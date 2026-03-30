import crypto from 'crypto';
import PatientAccess from '../models/PatientAccess.js';

/* ── helpers ── */
function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

async function uniqueCode() {
  let code;
  let attempts = 0;
  do {
    code = generateCode();
    const exists = await PatientAccess.exists({ accessCode: code });
    if (!exists) return code;
    attempts++;
  } while (attempts < 10);
  throw new Error('Could not generate unique code');
}

const SAFE_FIELDS = 'patientId patientName bedNumber plan issuedBy accessCode isActive expiresAt issuedAt lastAccessedAt';

/* ── POST /api/patient-access/verify ── */
export async function verifyCode(req, res) {
  try {
    const code = (req.body.accessCode || '').trim().toUpperCase();
    if (!code) return res.json({ success: false, error: 'Access code required.' });

    const record = await PatientAccess.findOne({ accessCode: code }).select(SAFE_FIELDS);
    if (!record || !record.isActive) {
      return res.json({ success: false, error: 'Invalid or expired access code.' });
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      return res.json({ success: false, error: 'Invalid or expired access code.' });
    }

    record.lastAccessedAt = new Date();
    await record.save();

    return res.json({
      success: true,
      data: {
        patientId:   record.patientId,
        patientName: record.patientName,
        bedNumber:   record.bedNumber,
        plan:        record.plan,
        issuedBy:    record.issuedBy,
        accessCode:  record.accessCode,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── POST /api/patient-access/issue ── */
export async function issueCode(req, res) {
  try {
    const { patientId, patientName, bedNumber, plan, issuedBy, expiresAt } = req.body;
    if (!patientId || !patientName || !bedNumber || !plan) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }
    const accessCode = await uniqueCode();
    const record = await PatientAccess.create({
      patientId, patientName, bedNumber, plan,
      issuedBy: issuedBy || '',
      accessCode,
      expiresAt: expiresAt || null,
    });
    return res.json({ success: true, data: { accessCode: record.accessCode, plan: record.plan } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── GET /api/patient-access/:patientId ── */
export async function listCodes(req, res) {
  try {
    const records = await PatientAccess.find({ patientId: req.params.patientId }).select(SAFE_FIELDS);
    return res.json({ success: true, data: records });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── PUT /api/patient-access/:accessCode/deactivate ── */
export async function deactivateCode(req, res) {
  try {
    const record = await PatientAccess.findOneAndUpdate(
      { accessCode: req.params.accessCode.toUpperCase() },
      { isActive: false },
      { new: true }
    ).select(SAFE_FIELDS);
    if (!record) return res.status(404).json({ success: false, error: 'Code not found.' });
    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── Seed two codes for Rahul Sharma (idempotent) ── */
export async function seedAccessCodes() {
  const seeds = [
    { patientId: 'rahul-sharma', patientName: 'Rahul Sharma', bedNumber: 'Bed 4A', accessCode: 'RAH001', plan: 'basic',   issuedBy: 'Dr. Anjali Mehta' },
    { patientId: 'rahul-sharma', patientName: 'Rahul Sharma', bedNumber: 'Bed 4A', accessCode: 'RAH002', plan: 'premium', issuedBy: 'Dr. Anjali Mehta' },
  ];
  for (const seed of seeds) {
    await PatientAccess.updateOne({ accessCode: seed.accessCode }, { $setOnInsert: seed }, { upsert: true });
  }
  console.log('Access codes seeded: RAH001 (basic), RAH002 (premium)');
}
