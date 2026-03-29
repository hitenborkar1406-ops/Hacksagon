import { setValve, getIVState } from '../services/simulatorService.js';
import { emitIVUpdate } from '../sockets/index.js';

/**
 * POST /api/control/valve
 * body: { patientId, action: 'open' | 'close' }
 */
export function handleValveControl(io, patientId, action) {
  const open = action === 'open';
  const iv = setValve(patientId, open);
  if (!iv) return null;

  emitIVUpdate(io, {
    patientId,
    valveOpen: iv.valveOpen,
    remaining: iv.remaining,
    backflow: iv.backflow,
    rate: iv.valveOpen ? iv.prescribedRate : 0,
  });

  return { success: true, valveOpen: iv.valveOpen };
}
