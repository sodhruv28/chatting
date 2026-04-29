// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create socket instance, but don't auto-connect until we have a JWT
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export const connectSocket = (token) => {
  if (token) {
    socket.auth = { token };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};

// Add error handling for socket connection
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

export default socket;
