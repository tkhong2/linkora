import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socket = null;

export const getSocket = () => socket;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  // Support both old 'token' key and new 'accessToken' key
  const t = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (!t) return null;
  socket = io(URL, { auth: { token: t }, reconnection: true });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
