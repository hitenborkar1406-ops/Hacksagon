import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { setupSockets } from './sockets/index.js';
import vitalsRoutes from './routes/vitalsRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import controlRoutes from './routes/controlRoutes.js';
import sessionsRoutes from './routes/sessions.js';
import insightsRoutes from './routes/insights.js';
import aiProxyRoutes from './routes/aiProxy.js';
import authRoutes from './routes/authRoutes.js';
import patientAccessRoutes from './routes/patientAccess.js';
import { seedPatients } from './controllers/patientController.js';
import { seedAuthUsers } from './controllers/authController.js';
import { seedBottleSessions } from './services/seedService.js';
import { seedAccessCodes } from './controllers/patientAccessController.js';
import { startSimulator, registerPatients } from './services/simulatorService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

const corsOrigin = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Setup Socket.io (must come before routes that emit)
const io = setupSockets(server, app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/iv', controlRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analyze-frame', aiProxyRoutes);
app.use('/api/patient-access', patientAccessRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vitaflow-backend', port });
});

(async () => {
  await connectDB();

  // Seed patients + bottle sessions
  try {
    const patients = await seedPatients();
    registerPatients(patients);
    await seedBottleSessions();
  } catch (err) {
    console.warn('Seeding unavailable — using in-memory mode:', err.message);
    const mockPatients = [
      { _id: { toString: () => 'p1' }, name: 'Rahul Sharma', prescribedRate: 45, bedNumber: 'Bed 4A' },
      { _id: { toString: () => 'p2' }, name: 'Meena Patel', prescribedRate: 45, bedNumber: 'Bed 4B' },
      { _id: { toString: () => 'p3' }, name: 'Arjun Kumar', prescribedRate: 45, bedNumber: 'Bed 5A' },
    ];
    registerPatients(mockPatients);
  }

  try {
    await seedAuthUsers();
  } catch (e) {
    console.warn('Auth user seed:', e.message);
  }

  try {
    await seedAccessCodes();
  } catch (e) {
    console.warn('Access code seed:', e.message);
  }

  // Start simulator only in development
  if (process.env.NODE_ENV !== 'production') {
    startSimulator(io);
  }

  server.listen(port, () => {
    console.log(`VitaFlow AI backend running on http://localhost:${port}`);
    console.log(`CORS origin: ${corsOrigin}`);
  });
})();
