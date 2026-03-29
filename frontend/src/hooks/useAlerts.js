import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket.js';
import { getAlerts, resolveAlert as resolveAlertAPI } from '../api/index.js';

/**
 * useAlerts(patientId)
 * Fetches unresolved alerts, appends live new_alert events.
 * Returns { alerts, unresolvedCount, resolveAlert }
 */
export function useAlerts(patientId) {
  const [alerts, setAlerts] = useState([]);

  // Fetch on mount / patientId change
  useEffect(() => {
    getAlerts(patientId)
      .then((res) => setAlerts(res?.data || res || []))
      .catch(() => {});
  }, [patientId]);

  // Live new alerts
  useEffect(() => {
    const handler = (alert) => {
      // Accept global alerts or ones matching this patient
      if (patientId && alert.patientId && alert.patientId.toString() !== patientId.toString()) return;
      setAlerts((prev) => {
        // Avoid duplicates by _id
        if (prev.some((a) => a._id === alert._id)) return prev;
        return [alert, ...prev];
      });
    };
    socket.on('alert:new', handler);
    socket.on('new_alert', handler);
    return () => {
      socket.off('alert:new', handler);
      socket.off('new_alert', handler);
    };
  }, [patientId]);

  const resolveAlert = useCallback(async (id) => {
    try {
      await resolveAlertAPI(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch {
      // Local optimistic removal already done if needed
    }
  }, []);

  const unresolvedCount = alerts.filter((a) => !a.acknowledged && !a.resolved).length;

  return { alerts, unresolvedCount, resolveAlert };
}
