import FriendRequest from "../models/FriendRequest.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import OnlineStatus from "../models/OnlineStatus.js";
import bcrypt from "bcrypt";

// Create (Register new user)
export const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({
      message: "Error creating user",
      error: err.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    //Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      message: "Error logging in",
      error: err.message
    });
  }
};

// Get All Users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

// Get Single User by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};


export const searchUser = async (req, res) => {
  const { query } = req.query;
  const currentUserId = req.user.id;

  try {
    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }

    const me = await User.findById(currentUserId).select("blocked");
    if (!me) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // find candidate user by username/email
    const candidate = await User.findOne({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: `^${query}$`, $options: "i" } },
        { email: { $regex: `^${query}$`, $options: "i" } },
      ],
    }).select("-password");

    if (!candidate) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1) you blocked them?
    const iBlocked = me.blocked.some(
      (id) => String(id) === String(candidate._id)
    );

    // 2) they blocked you?
    const they = await User.findById(candidate._id).select("blocked");
    const theyBlocked = they.blocked.some(
      (id) => String(id) === String(currentUserId)
    );

    if (iBlocked || theyBlocked) {
      return res.status(404).json({ message: "User not found" });
    }

    // existing status logic
    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser.friends.includes(candidate._id);

    if (isFriend) {
      return res.json({ user: candidate, status: "friends" });
    }

    const sentRequest = await FriendRequest.findOne({
      sender: currentUserId,
      receiver: candidate._id,
      status: "pending",
    });

    if (sentRequest) {
      return res.json({ user: candidate, status: "request_sent" });
    }

    const receivedRequest = await FriendRequest.findOne({
      sender: candidate._id,
      receiver: currentUserId,
      status: "pending",
    });

    if (receivedRequest) {
      return res.json({ user: candidate, status: "request_received" });
    }

    return res.json({ user: candidate, status: "none" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// Update User
export const updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const updatedData = { username, email };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating user",
      error: err.message
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const statusDoc = await OnlineStatus.findOne({ user: id });

    res.status(200).json({
      isOnline: statusDoc ? !!statusDoc.isOnline : false,
      lastSeen: statusDoc?.lastSeen || null,
    });
  } catch (err) {
    console.error("Get User Status Error:", err);
    res.status(500).json({
      message: "Error fetching user status",
      error: err.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(me);
  } catch (err) {
    console.error("GetMe Error:", err);
    res.status(500).json({
      message: "Error fetching profile",
      error: err.message,
    });
  }
};


export const updateMe = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ---------- Update username ---------- */
    if (typeof username === "string" && username.trim()) {
      user.username = username.trim();
    }

    /* ---------- Update password (ONLY if password exists) ---------- */
    if (newPassword) {
      // 🚨 Firebase users may not have a password
      if (!user.password) {
        return res.status(400).json({
          message: "Password change not allowed for this account",
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required",
        });
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("❌ UpdateMe Error:", err);
    res.status(500).json({
      message: "Error updating profile",
      error: err.message,
    });
  }
};


export const getBlockedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate(
      "blocked",
      "username email"
    );
    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(me.blocked || []);
  } catch (err) {
    console.error("GetBlockedUsers Error:", err);
    res.status(500).json({
      message: "Error fetching blocked users",
      error: err.message,
    });
  }
};


export const blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (String(targetId) === String(myId)) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const [me, other] = await Promise.all([
      User.findById(myId),
      User.findById(targetId),
    ]);
    if (!me || !other) {
      return res.status(404).json({ message: "User not found" });
    }

    // add to my blocked list if not already
    if (!me.blocked.some((u) => String(u) === String(targetId))) {
      me.blocked.push(targetId);
    }

    // remove each other from friends
    me.friends = me.friends.filter((f) => String(f) !== String(targetId));
    other.friends = other.friends.filter((f) => String(f) !== String(myId));

    await Promise.all([me.save(), other.save()]);

    res.status(200).json({ message: "User blocked and removed from friends" });
  } catch (err) {
    console.error("BlockUser Error:", err);
    res.status(500).json({
      message: "Error blocking user",
      error: err.message,
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const me = await User.findById(req.user.id);
    if (!me) return res.status(404).json({ message: "User not found" });

    me.blocked = me.blocked.filter((u) => String(u) !== String(targetId));
    await me.save();

    res.status(200).json({ message: "User unblocked" });
  } catch (err) {
    console.error("UnblockUser Error:", err);
    res.status(500).json({
      message: "Error unblocking user",
      error: err.message,
    });
  }
};


// export const deleteMe = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // remove from other users' friends arrays
//     await User.updateMany(
//       { friends: userId },
//       { $pull: { friends: userId } }
//     );

//     // delete friend requests involving this user
//     await FriendRequest.deleteMany({
//       $or: [{ sender: userId }, { receiver: userId }],
//     });

//     // TODO: optionally delete ChatMessage docs with sender/receiver = userId

//     const user = await User.findByIdAndDelete(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ message: "Account deleted" });
//   } catch (err) {
//     console.error("DeleteMe Error:", err);
//     res.status(500).json({
//       message: "Error deleting account",
//       error: err.message,
//     });
//   }
// };
