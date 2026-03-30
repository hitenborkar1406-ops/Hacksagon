/**
 * ProtectedPatientRoute.jsx
 * Redirects to /patient/login if plan session is not authenticated.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan.js';

export default function ProtectedPatientRoute({ children }) {
  const { isAuthenticated } = usePlan();
  const loc = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/patient/login" state={{ from: loc.pathname }} replace />;
  }

  return children;
}
