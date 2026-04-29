// src/socket.js
import { io } from "socket.io-client";

// Create socket instance, but don't auto-connect until we have a JWT
const socket = io(import.meta.env.VITE_API_URL || ${import.meta.env.VITE_API_URL || "http://localhost:5000"}, err.message);
});

export default socket;
