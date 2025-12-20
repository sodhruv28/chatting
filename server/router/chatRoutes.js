import express from "express";
import { getChatHistory, markAsRead, getUnreadCounts,markMessagesRead, getLastMessages } from "../controllers/chatController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/history/:friendId", verifyJWT, getChatHistory);
router.get("/unread-counts", verifyJWT, getUnreadCounts);
router.patch("/read/:friendId", verifyJWT, markAsRead);
router.get("/last-messages", verifyJWT, getLastMessages);
router.patch("/mark-read/:friendId", verifyJWT, markMessagesRead);

export default router;
