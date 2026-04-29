import admin from "../config/firebase.js";
import { generateToken } from "../utils/jwtUtils.js";
import User from "../models/userModel.js";

export const firebaseLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token missing" });
    }
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, name } = decoded;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firebaseUID: uid,
        email,
        username: name || email.split("@")[0]
      });
    }
    const token = generateToken({
      id: user._id,
      email: user.email
    });
    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error("Firebase Login Error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export const register = async (req, res) => {
  try {
    const { firebaseToken, username } = req.body;

    if (!firebaseToken || !username) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email } = decoded;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists in our database" });
    }

    // Check if username is taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    user = await User.create({
      firebaseUID: uid,
      email,
      username
    });

    const token = generateToken({
      id: user._id,
      email: user.email
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};
