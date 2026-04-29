import express from "express";
import {
  sendFriendRequest,
  getIncomingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendsList
} from "../controllers/friendController.js";

import { verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyJWT, getFriendsList);
router.get("/requests", verifyJWT, getIncomingRequests);
router.get("/requests/sent", verifyJWT, getSentRequests);
router.post("/request", verifyJWT, sendFriendRequest);
router.post("/accept", verifyJWT, acceptFriendRequest);
router.post("/reject", verifyJWT, rejectFriendRequest);
router.delete("/:friendId", verifyJWT, removeFriend);

export default router;
