import express from "express";
import { getChatHistory, markAsRead } from "../controllers/chatController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/history/:friendId", verifyJWT, getChatHistory);
router.patch("/read/:friendId", verifyJWT, markAsRead);

export default router;
