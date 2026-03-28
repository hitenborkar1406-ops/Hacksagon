import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vitals from './pages/Vitals';
import IVMonitor from './pages/IVMonitor';
import Camera from './pages/Camera';
import Alerts from './pages/Alerts';
import DrugReport from './pages/DrugReport';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="iv-monitor" element={<IVMonitor />} />
        <Route path="camera" element={<Camera />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="drug-report" element={<DrugReport />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
