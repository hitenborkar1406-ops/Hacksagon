import { io } from 'socket.io-client';

// In dev: falls back to http://localhost:5000 (direct connection, bypasses Vite proxy)
// In prod (Netlify/Vercel): VITE_API_URL must be set to the deployed backend URL
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 5000,
});
