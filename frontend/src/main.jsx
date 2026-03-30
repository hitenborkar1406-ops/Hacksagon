import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { PatientProvider } from './context/PatientContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PlanProvider } from './context/PlanContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlanProvider>
          <PatientProvider>
            <App />
          </PatientProvider>
        </PlanProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
