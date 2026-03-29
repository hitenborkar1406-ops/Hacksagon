import { getIVState } from '../services/simulatorService.js';

/** GET /api/iv/:patientId — latest IV state for a patient */
export function getIVData(patientId) {
  const iv = getIVState(patientId);
  if (!iv) return null;
  return { ...iv, patientId };
}
