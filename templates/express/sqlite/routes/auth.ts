import express from "express";
import { signup, login, health, getAllUsers } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/health", health);

// Protected route to get all users (requires authentication)
router.get("/users", authenticate, getAllUsers);

export default router;
