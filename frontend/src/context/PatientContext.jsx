import { useEffect, useState } from 'react';
import { getPatients } from '../api/index.js';
import { PatientContext } from './patientContext.js';

const MOCK_PATIENTS = [
  { _id: 'p1', slug: 'rahul-sharma', name: 'Rahul Sharma', bedNumber: 'Bed 4A', age: 42, condition: 'Stable', ward: 'Ward 3B', assignedDoctor: 'Dr. Anjali Mehta', prescribedRate: 45 },
  { _id: 'p2', name: 'Meena Patel', bedNumber: 'Bed 4B', age: 67, condition: 'Watch', ward: 'Ward 3B', assignedDoctor: 'Dr. Anjali Mehta', prescribedRate: 45 },
  { _id: 'p3', name: 'Arjun Kumar', bedNumber: 'Bed 5A', age: 31, condition: 'Critical', ward: 'Ward 3B', assignedDoctor: 'Dr. Anjali Mehta', prescribedRate: 45 },
  { _id: 'p4', name: 'Sunita Rao', bedNumber: 'Bed 5B', age: 55, condition: 'Stable', ward: 'Ward 3B', assignedDoctor: 'Dr. Anjali Mehta', prescribedRate: 45 },
  { _id: 'p5', name: 'Vikram Desai', bedNumber: 'Bed 6A', age: 48, condition: 'Stable', ward: 'Ward 3B', assignedDoctor: 'Dr. Anjali Mehta', prescribedRate: 45 },
  { _id: 'p6', name: 'Priya Nair', bedNumber: 'Bed 6B', age: 38, condition: 'Watch', ward: 'Ward 3B', assignedDoctor: 'Dr. Anjali Mehta', prescribedRate: 45 },
];

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients()
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length > 0) {
          setPatients(list);
          setSelectedPatientId(list[0]._id?.toString?.() || list[0]._id);
        } else {
          setSelectedPatientId(MOCK_PATIENTS[0]._id);
        }
      })
      .catch(() => {
        // Backend unavailable — use mock patients
        setSelectedPatientId(MOCK_PATIENTS[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedPatient =
    patients.find((p) => (p._id?.toString?.() || p._id) === selectedPatientId) ||
    patients[0] ||
    null;

  return (
    <PatientContext.Provider
      value={{ patients, selectedPatientId, setSelectedPatientId, selectedPatient, loading }}
    >
      {children}
    </PatientContext.Provider>
  );
}
