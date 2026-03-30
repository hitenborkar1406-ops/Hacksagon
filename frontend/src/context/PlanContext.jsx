import { createContext, useContext, useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SESSION_KEY = 'vitaflow_patient_session';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plan, setPlan] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.plan && saved?.patientInfo) {
          setPlan(saved.plan);
          setPatientInfo(saved.patientInfo);
          setIsAuthenticated(true);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  async function login(accessCode) {
    const code = accessCode.trim().toUpperCase().slice(0, 6);
    const res = await fetch(`${API}/api/patient-access/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode: code }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Invalid or expired access code.');

    const { plan: p, patientId, patientName, bedNumber, accessCode: ac } = json.data;
    const info = { patientId, patientName, bedNumber, accessCode: ac };

    setPlan(p);
    setPatientInfo(info);
    setIsAuthenticated(true);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ plan: p, patientInfo: info }));
    return json.data;
  }

  function logout() {
    setPlan(null);
    setPatientInfo(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <PlanContext.Provider value={{ isAuthenticated, plan, patientInfo, login, logout }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  return useContext(PlanContext);
}
