import { useState, useEffect } from 'react';
import { socket } from '../socket.js';
import { getVitals } from '../api/index.js';

/**
 * useVitals(patientId, maxPoints)
 * Fetches last maxPoints readings on mount, then appends live socket updates.
 * Returns { vitals, latest, loading }
 */
export function useVitals(patientId, maxPoints = 30) {
  const [state, setState] = useState({
    loadedPatientId: null,
    vitals: [],
  });

  // Fetch initial history
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    getVitals(patientId, maxPoints)
      .then((res) => {
        if (cancelled) return;
        const list = (res?.data || res || []).slice().reverse(); // oldest→newest
        setState({
          loadedPatientId: patientId,
          vitals: list,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          loadedPatientId: patientId,
          vitals: [],
        });
      }); // ignore — socket will populate
    return () => {
      cancelled = true;
    };
  }, [patientId, maxPoints]);

  // Subscribe to live updates
  useEffect(() => {
    if (!patientId) return;
    const handler = (data) => {
      if ((data.patientId?.toString?.() || data.patientId) !== patientId?.toString()) return;
      setState((prev) => {
        if (prev.loadedPatientId !== patientId) return prev;
        const next = [...prev.vitals, data];
        return {
          ...prev,
          vitals: next.length > maxPoints ? next.slice(-maxPoints) : next,
        };
      });
    };
    socket.on('vitals_update', handler);
    socket.on('vitals:new', handler);
    return () => {
      socket.off('vitals_update', handler);
      socket.off('vitals:new', handler);
    };
  }, [patientId, maxPoints]);

  const vitals = state.loadedPatientId === patientId ? state.vitals : [];
  const latest = vitals[vitals.length - 1] || null;
  const loading = Boolean(patientId) && state.loadedPatientId !== patientId;
  return { vitals, latest, loading };
}
