import express from "express";
import {
  sendFriendRequest,
  getIncomingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendsList
} from "../controllers/friendController.js";

import { verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", verifyJWT, sendFriendRequest);
router.get("/requests", verifyJWT, getIncomingRequests);
router.put("/accept/:id", verifyJWT, acceptFriendRequest);
router.put("/reject/:id", verifyJWT, rejectFriendRequest);
router.delete("/:friendId", verifyJWT, removeFriend);
router.get("/list", verifyJWT, getFriendsList);

export default router;
