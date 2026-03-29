import express from 'express';
import { createVitals, getLatestVitals, getVitalsHistory } from '../controllers/vitalsController.js';

const router = express.Router();

// POST /api/vitals
router.post('/', async (req, res) => {
  try {
    const vitals = await createVitals(req);
    res.status(201).json({ success: true, data: vitals });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, error: err.message });
  }
});

// GET /api/vitals/latest
router.get('/latest', async (req, res) => {
  try {
    const latest = await getLatestVitals(req.query.patientId);
    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vitals/history?patientId=&limit=
router.get('/history', async (req, res) => {
  try {
    const history = await getVitalsHistory(req.query.patientId, req.query.limit);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vitals/:patientId (shortcut route)
router.get('/:patientId', async (req, res) => {
  try {
    const history = await getVitalsHistory(req.params.patientId, req.query.limit || 30);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
