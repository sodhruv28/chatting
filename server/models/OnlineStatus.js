import mongoose from "mongoose";

const onlineStatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date
  }
});

export default mongoose.model("OnlineStatus", onlineStatusSchema);
