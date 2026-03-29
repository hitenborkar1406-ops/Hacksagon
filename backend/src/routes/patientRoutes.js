import express from 'express';
import {
  getAllPatients,
  getPatientById,
  getPatientLatestVitals,
  getPatientIVState,
} from '../controllers/patientController.js';

const router = express.Router();

// GET /api/patients
router.get('/', async (_req, res) => {
  try {
    const patients = await getAllPatients();
    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    const vitals = await getPatientLatestVitals(req.params.id, 1);
    const iv = getPatientIVState(req.params.id);
    res.json({ success: true, data: { ...patient.toObject(), latestVitals: vitals[0] || null, iv } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/patients/:id/vitals?limit=30
router.get('/:id/vitals', async (req, res) => {
  try {
    const vitals = await getPatientLatestVitals(req.params.id, req.query.limit);
    res.json({ success: true, data: vitals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
