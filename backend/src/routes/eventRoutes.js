import express from 'express';
import { createEvent } from '../controllers/eventController.js';
import { getLatestInsight } from '../services/drugCurveService.js';

const router = express.Router();

// POST /api/events
router.post('/', async (req, res) => {
  try {
    const event = await createEvent(req.body, req.app.locals.io);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, error: err.message });
  }
});

// GET /api/insights
router.get('/insights', async (_req, res) => {
  const insight = getLatestInsight();
  res.json({ success: true, data: insight });
});

export default router;
