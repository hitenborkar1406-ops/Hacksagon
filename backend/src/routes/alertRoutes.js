import express from 'express';
import { listAlerts, resolveAlert, createAlert } from '../controllers/alertController.js';

const router = express.Router();

// GET /api/alerts?patientId=&severity=&resolved=false
router.get('/', async (req, res) => {
  try {
    const alerts = await listAlerts(req.query);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', async (req, res) => {
  try {
    const alert = await resolveAlert(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts (manual creation — for testing)
router.post('/', async (req, res) => {
  try {
    const alert = await createAlert(req.body, req.app.locals.io);
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
