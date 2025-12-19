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

