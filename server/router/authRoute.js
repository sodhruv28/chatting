import express from "express";
import { firebaseLogin, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", firebaseLogin);
router.post("/register", register);

export default router;
