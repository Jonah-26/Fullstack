import { Router } from "express";
import { loginAdmin, registerAdmin, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Public routes
 * Anyone can register or log in
 */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/**
 * Protected routes
 * Requires valid JWT
 */
router.get("/me", requireAuth, me);

export default router;
