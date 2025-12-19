import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/userModel.js";
import OnlineStatus from "./models/OnlineStatus.js";
import ChatMessage from "./models/ChatMessage.js";
import { setIo } from "./controllers/friendController.js";

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  setIo(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("Socket connected:", socket.userId);

    socket.join(String(socket.userId));

    await OnlineStatus.findOneAndUpdate(
      { user: socket.userId },
      { isOnline: true, lastSeen: null },
      { upsert: true }
    );

    socket.broadcast.emit("user-online", {
      userId: socket.userId,
    });

    socket.on("join-chat", ({ friendId, userId }) => {
      const me = userId || socket.userId;
      const room = [me, friendId].sort().join("_");
      socket.join(room);
    });


    socket.on("send-message", async ({ receiver, message }) => {
      try {
        if (!receiver || !message) return;

        const senderId = socket.userId;
        const receiverId = receiver;

        const [senderUser, receiverUser] = await Promise.all([
          User.findById(senderId).select("blocked"),
          User.findById(receiverId).select("blocked"),
        ]);

        if (!senderUser || !receiverUser) return;

        const senderBlocksReceiver = senderUser.blocked?.some(
          (id) => String(id) === String(receiverId)
        );
        const receiverBlocksSender = receiverUser.blocked?.some(
          (id) => String(id) === String(senderId)
        );
        if (senderBlocksReceiver || receiverBlocksSender) {
          socket.emit("message-blocked", { to: receiverId });
          return;
        }

        const room = [senderId, receiverId].sort().join("_");

        const chat = await ChatMessage.create({
          sender: senderId,
          receiver: receiverId,
          message,
          isRead: false,
        });

        io.to(room).emit("receive-message", {
          _id: chat._id,
          sender: chat.sender,
          receiver: chat.receiver,
          message: chat.message,
          createdAt: chat.createdAt,
          isRead: chat.isRead,
        });
      } catch (err) {
        console.error("send-message error:", err);
      }
    });

    socket.on("typing", ({ to }) => {
      if (!to) return;
      io.to(String(to)).emit("typing", { from: socket.userId });
    });

    socket.on("call:offer", async ({ to, offer }) => {
      if (!to || !offer) return;
      try {
        const caller = await User.findById(socket.userId).select(
          "username email"
        );

        io.to(String(to)).emit("call:incoming", {
          from: socket.userId,
          offer,
          caller,
        });
      } catch (err) {
        console.error("❌ call:offer failed:", err);
      }
    });

    socket.on("call:answer", ({ to, answer }) => {
      if (!to || !answer) return;
      io.to(String(to)).emit("call:answered", {
        from: socket.userId,
        answer,
      });
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(String(to)).emit("call:ice-candidate", {
        from: socket.userId,
        candidate,
      });
    });

    socket.on("call:end", ({ to }) => {
      if (!to) return;
      io.to(String(to)).emit("call:ended", { from: socket.userId });
    });

    socket.on("disconnect", async () => {
      if (!socket.userId) return;

      await OnlineStatus.findOneAndUpdate(
        { user: socket.userId },
        { isOnline: false, lastSeen: new Date() }
      );

      io.emit("user-offline", { userId: socket.userId });
    });
  });

  return io;
}
