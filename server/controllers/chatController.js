import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";

export const getChats = async (req, res) => {
  const { friendId } = req.params;

  const chats = await ChatMessage.find({
    $or: [
      { sender: req.user.id, receiver: friendId },
      { sender: friendId, receiver: req.user.id }
    ]
  }).sort({ createdAt: 1 });

  res.json(chats);
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    await ChatMessage.updateMany(
      {
        sender: friendId,
        receiver: userId,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id; // or req.user._id if that's what your auth sets
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const agg = await ChatMessage.aggregate([
      {
        $match: {
          receiver: userObjectId,
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = agg.map((row) => ({
      friendId: row._id.toString(),
      count: row.count,
    }));

    res.json(result);
  } catch (err) {
    console.error("getUnreadCounts error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const markMessagesRead = async (req, res) => {
  try {
    const userId = req.user.id;      // who read
    const friendId = req.params.friendId; // sender

    await ChatMessage.updateMany(
      {
        sender: friendId,
        receiver: userId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    // 🔥 THIS IS THE MAGIC LINE
    const io = req.app.get("io");
    if (io) {
      io.to(String(friendId)).emit("messages:read", {
        by: userId,   // who read the messages
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("markMessagesRead error:", err);
    res.status(500).json({ error: err.message });
  }
};
