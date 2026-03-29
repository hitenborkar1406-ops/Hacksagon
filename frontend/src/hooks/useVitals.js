import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket.js';
import { getVitals } from '../api/index.js';

/**
 * useVitals(patientId)
 * Fetches last 30 readings on mount, then appends live socket updates.
 * Returns { vitals, latest, loading }
 */
export function useVitals(patientId) {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial history
  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    getVitals(patientId, 30)
      .then((res) => {
        const list = (res?.data || res || []).slice().reverse(); // oldest→newest
        setVitals(list);
      })
      .catch(() => {}) // ignore — socket will populate
      .finally(() => setLoading(false));
  }, [patientId]);

  // Subscribe to live updates
  useEffect(() => {
    if (!patientId) return;
    const handler = (data) => {
      if ((data.patientId?.toString?.() || data.patientId) !== patientId?.toString()) return;
      setVitals((prev) => {
        const next = [...prev, data];
        return next.length > 30 ? next.slice(-30) : next;
      });
    };
    socket.on('vitals_update', handler);
    socket.on('vitals:new', handler);
    return () => {
      socket.off('vitals_update', handler);
      socket.off('vitals:new', handler);
    };
  }, [patientId]);

  const latest = vitals[vitals.length - 1] || null;
  return { vitals, latest, loading };
}
