import { useState, useEffect } from 'react';
import { socket } from '../socket.js';
import { getIV } from '../api/index.js';

/**
 * useIV(patientId)
 * Fetches current IV state then listens for live iv_update events.
 * Returns { ivData, loading }
 */
export function useIV(patientId) {
  const [ivData, setIvData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial IV state
  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    getIV(patientId)
      .then((res) => setIvData(res?.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  // Subscribe to live updates
  useEffect(() => {
    if (!patientId) return;
    const handler = (data) => {
      if ((data.patientId?.toString?.() || data.patientId) !== patientId?.toString()) return;
      setIvData((prev) => ({ ...prev, ...data }));
    };
    socket.on('iv_update', handler);
    socket.on('iv:update', handler);
    return () => {
      socket.off('iv_update', handler);
      socket.off('iv:update', handler);
    };
  }, [patientId]);

  return { ivData, loading };
}
