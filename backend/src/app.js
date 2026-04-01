import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./db.js";
import { setupSockets } from "./sockets/index.js";

import vitalsRoutes from "./routes/vitalsRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";
import analyzeFrameRoutes from "./routes/analyzeFrameRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientsRoutes from "./routes/patientsRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import nodeRoutes from "./routes/nodeRoutes.js";
import ivRoutes from "./routes/ivRoutes.js";

import startMockNodeCollector from "./mock/startMockNodeCollector.js";

// Fix __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env (works both locally + Render)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback

const app = express();
const server = http.createServer(app);

// 🔥 REQUIRED for Render
const PORT = process.env.PORT || 5000;

// 🔌 Setup sockets BEFORE routes
setupSockets(server, app);

// 🌐 CORS config
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : "*";

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.json());

// 📦 Routes
app.use("/api/vitals", vitalsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/analyze-frame", analyzeFrameRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/iv", ivRoutes);

// 🩺 Health check (important for Render)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

// 🚀 Start server ONLY after DB connects
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });

    // optional mock data
    startMockNodeCollector(app.locals.io);
  })
  .catch((error) => {
    console.error("❌ Failed to start backend:", error.message);
    process.exit(1);
  });