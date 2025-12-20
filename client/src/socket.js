// src/socket.js
import { io } from "socket.io-client";

// Create socket instance, but don't auto-connect until we have a JWT
const socket = io("http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket"],
});

// Call this after login/register, or on app start if jwt exists
export function connectSocket() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    console.warn("[socket] No JWT found, not connecting");
    return;
  }
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
}

// Optional helper if you ever need to force disconnect
export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

// Dev logs
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("🔥 Socket connect error:", err.message);
});

export default socket;
