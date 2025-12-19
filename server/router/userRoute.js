import express from "express";
import { verifyJWT } from "../middleware/authMiddleware.js";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUser,
  getUserStatus,
  loginUser,
  getMe,
  updateMe,
  // deleteMe,
  getBlockedUsers,
  blockUser,
  unblockUser,
} from "../controllers/userController.js";

const router = express.Router();
router.post("/add", createUser);
router.post("/login", loginUser);

router.get("/", getUsers);

router.get("/me", verifyJWT, getMe);
router.patch("/me", verifyJWT, updateMe);
// router.delete("/me", verifyJWT, deleteMe);

router.get("/blocked", verifyJWT, getBlockedUsers);
router.post("/block/:id", verifyJWT, blockUser);
router.delete("/block/:id", verifyJWT, unblockUser);

router.get("/status/:id", verifyJWT, getUserStatus);
router.get("/search", verifyJWT, searchUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
