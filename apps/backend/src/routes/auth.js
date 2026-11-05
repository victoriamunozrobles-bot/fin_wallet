import { Router } from "express";
import { getCurrentUser, login, loginDemo, logout, signUp, updateCurrentUser } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const auth = Router();

auth.post("/signup", signUp);
auth.post("/login", login);
auth.post("/demo", loginDemo);
auth.get("/me", authMiddleware, getCurrentUser);
auth.put("/me", authMiddleware, updateCurrentUser);
auth.post("/logout", authMiddleware, logout);

export default auth;
