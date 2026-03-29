import { useState, useEffect } from 'react';
import { socket } from '../socket.js';
import { getIV } from '../api/index.js';

/**
 * useIV(patientId)
 * Fetches current IV state then listens for live iv_update events.
 * Returns { ivData, loading }
 */
export function useIV(patientId) {
  const [state, setState] = useState({
    loadedPatientId: null,
    ivData: null,
  });

  // Fetch initial IV state
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    getIV(patientId)
      .then((res) => {
        if (cancelled) return;
        setState({
          loadedPatientId: patientId,
          ivData: res?.data || res,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          loadedPatientId: patientId,
          ivData: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  // Subscribe to live updates
  useEffect(() => {
    if (!patientId) return;
    const handler = (data) => {
      if ((data.patientId?.toString?.() || data.patientId) !== patientId?.toString()) return;
      setState((prev) => {
        if (prev.loadedPatientId !== patientId) return prev;
        return {
          ...prev,
          ivData: { ...(prev.ivData || {}), ...data },
        };
      });
    };
    socket.on('iv_update', handler);
    socket.on('iv:update', handler);
    return () => {
      socket.off('iv_update', handler);
      socket.off('iv:update', handler);
    };
  }, [patientId]);

  const ivData = state.loadedPatientId === patientId ? state.ivData : null;
  const loading = Boolean(patientId) && state.loadedPatientId !== patientId;

  return { ivData, loading };
}
