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
import { seedPatients } from './controllers/patientController.js';
import { startSimulator, registerPatients } from './services/simulatorService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// CORS — restrict to frontend origin (PRD §16.1)
const corsOrigin = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Mount socket.io
const io = setupSockets(server, app);

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/iv', controlRoutes);        // alias for /api/iv/:patientId
app.use('/api/insights', eventRoutes);    // /api/insights is sub-route of eventRoutes

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vitaflow-backend', port });
});

// Start
(async () => {
  await connectDB();

  // Seed patients + start simulator
  try {
    const patients = await seedPatients();
    registerPatients(patients);
    startSimulator(io);
  } catch (err) {
    // In-memory mode: create mock patient objects for simulator
    console.warn('Seeding unavailable — using in-memory patients:', err.message);
    const mockPatients = [
      { _id: { toString: () => 'p1' }, name: 'Rahul Sharma', prescribedRate: 45, bedNumber: 'Bed 4A' },
      { _id: { toString: () => 'p2' }, name: 'Meena Patel', prescribedRate: 45, bedNumber: 'Bed 4B' },
      { _id: { toString: () => 'p3' }, name: 'Arjun Kumar', prescribedRate: 45, bedNumber: 'Bed 5A' },
      { _id: { toString: () => 'p4' }, name: 'Sunita Rao', prescribedRate: 45, bedNumber: 'Bed 5B' },
      { _id: { toString: () => 'p5' }, name: 'Vikram Desai', prescribedRate: 45, bedNumber: 'Bed 6A' },
      { _id: { toString: () => 'p6' }, name: 'Priya Nair', prescribedRate: 45, bedNumber: 'Bed 6B' },
    ];
    registerPatients(mockPatients);
    startSimulator(io);
  }

  server.listen(port, () => {
    console.log(`VitaFlow AI backend running on http://localhost:${port}`);
    console.log(`CORS origin: ${corsOrigin}`);
  });
})();
