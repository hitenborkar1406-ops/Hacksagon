import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * useBottleSessions(patientId)
 * Fetches today's sessions on mount, subscribes to session:update.
 */
export function useBottleSessions(patientId) {
  const [state, setState] = useState({
    loadedPatientId: null,
    sessions: [],
    isRefreshing: false,
  });

  const fetchToday = useCallback(async ({ showLoading = true } = {}) => {
    if (!patientId) return;
    if (showLoading) {
      setState((prev) => ({ ...prev, isRefreshing: true }));
    }

    try {
      const response = await fetch(`${API}/api/sessions/${patientId}/today`);
      const json = await response.json();
      setState({
        loadedPatientId: patientId,
        sessions: Array.isArray(json?.data) ? json.data : [],
        isRefreshing: false,
      });
    } catch {
      setState({
        loadedPatientId: patientId,
        sessions: [],
        isRefreshing: false,
      });
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    queueMicrotask(() => {
      void fetchToday({ showLoading: false });
    });

    const onUpdate = ({ sessionId, vitalsTimeline }) => {
      setState((prev) => {
        if (prev.loadedPatientId !== patientId) return prev;
        return {
          ...prev,
          sessions: prev.sessions.map((session) => {
            const id = session._id?.toString?.() || session._id;
            if (id !== sessionId) return session;
            return {
              ...session,
              vitalsTimeline: [...(session.vitalsTimeline || []), vitalsTimeline],
            };
          }),
        };
      });
    };

    socket.on('session:update', onUpdate);
    return () => socket.off('session:update', onUpdate);
  }, [fetchToday, patientId]);

  const sessions = state.loadedPatientId === patientId ? state.sessions : [];
  const isLoading =
    Boolean(patientId) && (state.loadedPatientId !== patientId || state.isRefreshing);

  return {
    sessions,
    todaySessions: sessions,
    isLoading,
    refetch: () => fetchToday({ showLoading: true }),
  };
}

export default useBottleSessions;
