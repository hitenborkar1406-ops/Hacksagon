import { Server } from "socket.io";
import jwt from "jsonwebtoken";

function jwtSecret() {
  return process.env.JWT_SECRET || "dev-only-change-me";
}

export function setupSockets(httpServer, app) {
  const socketCors =
    process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim()
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
      : "*";
  const io = new Server(httpServer, {
    cors: { origin: socketCors, credentials: true },
  });

  app.locals.io = io;

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next();

    try {
      const payload = jwt.verify(token, jwtSecret());
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
    } catch (_err) {
      // If token is invalid, keep socket unauthenticated.
    }
    return next();
  });

  io.on("connection", (socket) => {
    if (socket.data.role === "patient" && socket.data.userId) {
      socket.join(`patient:${String(socket.data.userId)}`);
    }
    if (socket.data.role === "doctor") {
      socket.join("role:doctor");
    }
  });

  return io;
}

export function emitVitalsNew(io, vitals) {
  if (!io) return;
  const patientId = vitals?.patientId;
  const pid = patientId != null ? String(patientId) : "";
  if (pid) io.to(`patient:${pid}`).emit("vitals:new", vitals);
  io.to("role:doctor").emit("vitals:new", vitals);
}

export function emitAlertNew(io, alert) {
  if (!io) return;
  const patientId = alert?.patientId;
  const pid = patientId != null ? String(patientId) : "";
  if (pid) io.to(`patient:${pid}`).emit("alert:new", alert);
  io.to("role:doctor").emit("alert:new", alert);
}

export function emitInsightUpdate(io, payload) {
  if (!io) return;
  const patientId = payload?.patientId;
  const pid = patientId != null ? String(patientId) : "";
  if (pid) io.to(`patient:${pid}`).emit("insight:update", payload);
  io.to("role:doctor").emit("insight:update", payload);
}
