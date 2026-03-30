import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedPatientRoute from './components/patient/ProtectedPatientRoute';
import Dashboard from './pages/Dashboard';
import Vitals from './pages/Vitals';
import IVMonitor from './pages/IVMonitor';
import Camera from './pages/Camera';
import Alerts from './pages/Alerts';
import DrugReport from './pages/DrugReport';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientLogin from './pages/patient/PatientLogin';

import PatientLayout from './components/PatientLayout';
import PatientHome from './pages/patient/PatientHome';
import TodaySessions from './pages/patient/TodaySessions';
import BottleReport from './pages/patient/BottleReport';
import PatientHistory from './pages/patient/PatientHistory';
import ExportPanel from './pages/patient/ExportPanel';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Doctor clinical dashboard — staff auth required */}
      <Route
        path="/"
        element={
          <ProtectedRoute variant="staff">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="iv-monitor" element={<IVMonitor />} />
        <Route path="camera" element={<Camera />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="drug-report" element={<DrugReport />} />
      </Route>

      {/* Patient/family portal — unprotected login entry */}
      <Route path="/patient/login" element={<PatientLogin />} />

      {/* Patient/family routes — plan session required */}
      <Route
        path="/patient/:patientId"
        element={
          <ProtectedPatientRoute>
            <PatientLayout />
          </ProtectedPatientRoute>
        }
      >
        <Route index element={<PatientHome />} />
        <Route path="today" element={<TodaySessions />} />
        <Route path="bottle/:sessionId" element={<BottleReport />} />
        <Route path="history" element={<PatientHistory />} />
        <Route path="export" element={<ExportPanel />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
