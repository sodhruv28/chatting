import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./router/authRoute.js";
import userRoutes from "./router/userRoute.js";
import chatRoutes from "./router/chatRoutes.js";
import friendRoutes from "./router/friendRoutes.js";
import { initSocket } from "./socket.js";

dotenv.config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error(
    "FATAL ERROR: MONGO_URI and JWT_SECRET must be defined in the .env file.",
  );
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// 1. CORS MUST come first to ensure all responses (including errors/limits) have headers
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://chattingvc.netlify.app",
  "https://chattingvc.netlify.app/"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin in development or match allowedOrigins
    if (!origin || origin.startsWith("http://localhost:") || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting - Increased for active app usage
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 to prevent blocking chat/polling
  message: "Too many requests from this IP, please try again after 15 minutes"
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased for development/testing
  message: "Too many login attempts, please try again later"
});

app.use("/api/", generalLimiter);
app.use("/api/auth", authLimiter);
app.use(express.json());

// Health Check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "Server is healthy and running"
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB connection error:", err));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/friends", friendRoutes);

const io = initSocket(server);
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
    console.log("Shutting down server...");
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
