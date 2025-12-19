import FriendRequest from "../models/FriendRequest.js";
import User from "../models/userModel.js";

let ioInstance;
export const setIo = (io) => {
  ioInstance = io;
};

export const getIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending",
    }).populate("sender", "username email");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id)
      .populate("sender", "username email")
      .populate("receiver", "username email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "accepted";
    await request.save();

    // Add each other as friends
    await User.findByIdAndUpdate(request.sender._id, {
      $addToSet: { friends: request.receiver._id },
    });

    await User.findByIdAndUpdate(request.receiver._id, {
      $addToSet: { friends: request.sender._id },
    });

    // ✅ realtime update to both users
    if (ioInstance) {
      const senderId = String(request.sender._id);
      const receiverId = String(request.receiver._id);

      const payload = {
        _id: request._id,
        sender: request.sender,
        receiver: request.receiver,
        status: request.status,
      };

      ioInstance.to(senderId).emit("friend-request:accepted", payload);
      ioInstance.to(receiverId).emit("friend-request:accepted", payload);
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "rejected";
    await request.save();

    // ✅ realtime: notify sender their request was rejected
    if (ioInstance) {
      ioInstance
        .to(String(request.sender))
        .emit("friend-request:rejected", { _id: request._id });
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFriendsList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friends",
      "username email"
    );

    res.status(200).json(user.friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID missing" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "Cannot send request to yourself" });
    }

    const existing = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    // ✅ realtime: notify receiver immediately
    if (ioInstance) {
      const populatedReq = await request.populate(
        "sender",
        "username email"
      );
      ioInstance
        .to(String(receiverId))
        .emit("friend-request:received", populatedReq);
    }

    res.status(201).json({ message: "Friend request sent", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const removeFriend = async (req, res) => {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;

    const me = await User.findById(myId);
    const friend = await User.findById(friendId);

    if (!me || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // remove each other from friends arrays
    me.friends = me.friends.filter((f) => String(f) !== String(friendId));
    friend.friends = friend.friends.filter((f) => String(f) !== String(myId));

    await me.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed" });
  } catch (err) {
    console.error("RemoveFriend Error:", err);
    res.status(500).json({ message: "Error removing friend", error: err.message });
  }
};