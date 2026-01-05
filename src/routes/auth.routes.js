import express from "express";
import { loginAdmin, me, registerAdmin } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", requireAuth, me);

export default router;
