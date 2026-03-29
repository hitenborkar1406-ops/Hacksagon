import express from 'express';
import { setValve, getIVState } from '../services/simulatorService.js';
import { emitIVUpdate } from '../sockets/index.js';

const router = express.Router();

// POST /api/control/valve  { patientId, action: 'open' | 'close' }
router.post('/valve', async (req, res) => {
  try {
    const { patientId, action } = req.body;
    if (!patientId || !['open', 'close'].includes(action)) {
      return res.status(400).json({ success: false, error: 'patientId and action (open|close) required' });
    }
    const iv = setValve(patientId, action === 'open');
    if (!iv) return res.status(404).json({ success: false, error: 'Patient IV not found' });

    emitIVUpdate(req.app.locals.io, { patientId, valveOpen: iv.valveOpen, remaining: iv.remaining, backflow: iv.backflow });
    res.json({ success: true, valveOpen: iv.valveOpen });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/iv/:patientId
router.get('/:patientId', (req, res) => {
  const iv = getIVState(req.params.patientId);
  if (!iv) return res.status(404).json({ success: false, error: 'IV state not found' });
  res.json({ success: true, data: { ...iv, patientId: req.params.patientId } });
});

export default router;
