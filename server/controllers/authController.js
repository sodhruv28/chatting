import admin from "../config/firebase.js";
import jwt from "jsonwebtoken";
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
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
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
