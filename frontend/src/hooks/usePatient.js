import { useContext } from 'react';
import { PatientContext } from '../context/patientContext.js';

/**
 * usePatient()
 * Returns current selected patient from PatientContext.
 * Returns { patient, patients, selectedPatientId, setSelectedPatientId, loading }
 */
export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used within PatientProvider');
  return {
    patient: ctx.selectedPatient,
    patients: ctx.patients,
    selectedPatientId: ctx.selectedPatientId,
    setSelectedPatientId: ctx.setSelectedPatientId,
    loading: ctx.loading,
  };
}
