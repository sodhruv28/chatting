import { Server } from "socket.io";
import { verifyToken } from "./utils/jwtUtils.js";
import User from "./models/userModel.js";
import OnlineStatus from "./models/OnlineStatus.js";
import ChatMessage from "./models/ChatMessage.js";
import { setIo } from "./controllers/friendController.js";

export function initSocket(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://chattingvc.netlify.app",
    "https://chattingvc.netlify.app/"
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  setIo(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = verifyToken(token);
    if (!decoded) return next(new Error("Authentication failed"));

    socket.userId = decoded.id;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.userId);
    console.log(`[Socket] User connected: ${userId}`);

    socket.join(userId);

    // Update status to Online
    await OnlineStatus.findOneAndUpdate(
      { user: userId },
      { isOnline: true, lastSeen: null },
      { upsert: true }
    );

    // Notify friends only
    const user = await User.findById(userId).select("friends");
    if (user && user.friends) {
      user.friends.forEach((friendId) => {
        io.to(String(friendId)).emit("user:status", {
          userId,
          isOnline: true,
        });
      });
    }

    socket.on("chat:join", ({ friendId }) => {
      if (!friendId) return;
      const room = [userId, String(friendId)].sort().join("_");
      socket.join(room);
      console.log(`[Socket] ${userId} joined room: ${room}`);
    });

    socket.on("chat:leave", ({ friendId }) => {
      if (!friendId) return;
      const room = [userId, String(friendId)].sort().join("_");
      socket.leave(room);
      console.log(`[Socket] ${userId} left room: ${room}`);
    });

    socket.on("chat:send-message", async ({ receiver, message }) => {
      try {
        if (!receiver || !message?.trim()) return;

        const receiverId = String(receiver);

        const [senderUser, receiverUser] = await Promise.all([
          User.findById(userId).select("blocked"),
          User.findById(receiverId).select("blocked"),
        ]);

        if (!senderUser || !receiverUser) return;

        if (
          senderUser.blocked?.some((id) => String(id) === receiverId) ||
          receiverUser.blocked?.some((id) => String(id) === userId)
        ) {
          return socket.emit("chat:blocked", { to: receiverId });
        }

        const room = [userId, receiverId].sort().join("_");
        const chat = await ChatMessage.create({
          sender: userId,
          receiver: receiverId,
          chatId: room,
          message: message.trim(),
          isRead: false,
        });

        const now = new Date();
        await Promise.all([
          User.findByIdAndUpdate(userId, { [`friendsMeta.${receiverId}.lastMessageAt`]: now }),
          User.findByIdAndUpdate(receiverId, { [`friendsMeta.${userId}.lastMessageAt`]: now }),
        ]);

        const payload = {
          _id: chat._id,
          sender: chat.sender,
          receiver: chat.receiver,
          message: chat.message,
          createdAt: chat.createdAt,
          isRead: chat.isRead,
        };

        io.to(receiverId).emit("chat:receive-message", payload);
        io.to(receiverId).emit("chat:notification", payload);

      } catch (err) {
        console.error("[Socket] Message Error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("chat:read-all", async ({ friendId }) => {
      try {
        if (!friendId) return;
        const room = [userId, String(friendId)].sort().join("_");
        
        await ChatMessage.updateMany(
          { chatId: room, receiver: userId, isRead: false },
          { $set: { isRead: true } }
        );

        // Notify the other user that their messages were read
        io.to(String(friendId)).emit("chat:read-status", { from: userId });
      } catch (err) {
        console.error("[Socket] Read-all error:", err);
      }
    });

    socket.on("chat:typing", ({ to, isTyping }) => {
      if (!to) return;
      io.to(String(to)).emit("chat:typing", { from: userId, isTyping });
    });

    socket.on("call:offer", async ({ to, offer }) => {
      if (!to || !offer) return;
      try {
        const caller = await User.findById(userId).select("username email");
        io.to(String(to)).emit("call:incoming", { from: userId, offer, caller });
      } catch (err) {
        console.error("[Socket] Call Offer Error:", err);
      }
    });

    socket.on("call:answer", ({ to, answer }) => {
      if (!to || !answer) return;
      io.to(String(to)).emit("call:answered", { from: userId, answer });
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(String(to)).emit("call:ice-candidate", { from: userId, candidate });
    });

    socket.on("call:end", ({ to }) => {
      if (!to) return;
      io.to(String(to)).emit("call:ended", { from: userId });
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket] User disconnected: ${userId}`);

      await OnlineStatus.findOneAndUpdate(
        { user: userId },
        { isOnline: false, lastSeen: new Date() }
      );

      if (user && user.friends) {
        user.friends.forEach((friendId) => {
          io.to(String(friendId)).emit("user:status", {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        });
      }
    });
  });

  return io;
}
