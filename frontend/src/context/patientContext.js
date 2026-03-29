import { createContext, useContext } from 'react';

export const PatientContext = createContext(null);

export function usePatientContext() {
  return useContext(PatientContext);
}
