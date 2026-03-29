import { Server } from 'socket.io';

const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173';

export function setupSockets(httpServer, app) {
  const io = new Server(httpServer, {
    cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
    reconnection: true,
  });

  app.locals.io = io;

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
  });

  return io;
}

export function emitVitalsNew(io, data) {
  if (io) {
    io.emit('vitals:new', data);       // PRD canonical event name
    io.emit('vitals_update', data);    // alias for frontend hooks
  }
}

export function emitAlertNew(io, alert) {
  if (io) io.emit('alert:new', alert);
}

export function emitIVUpdate(io, data) {
  if (io) {
    io.emit('iv_update', data);        // frontend hook alias
    io.emit('iv:update', data);
  }
}

export function emitInsightUpdate(io, data) {
  if (io) io.emit('insight:update', data);
}
