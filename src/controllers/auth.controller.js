import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

function signToken(admin) {
  return jwt.sign(
    { adminId: admin._id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
export async function registerAdmin(req, res, next) {
  try {
    const { email, password, secret } = req.body;

    if (!email || !password || !secret) {
      return res.status(400).json({ message: "email, password, and secret are required" });
    }

    if (secret !== process.env.ADMIN_REGISTER_SECRET) {
      return res.status(403).json({ message: "Invalid register secret" });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email: email.toLowerCase(), passwordHash });

    const token = signToken(admin);

    return res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: { id: admin._id, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(admin);

    return res.json({
      message: "Login successful",
      token,
      admin: { id: admin._id, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me (protected)
export async function me(req, res, next) {
  try {
    return res.json({ adminId: req.user.adminId, email: req.user.email });
  } catch (err) {
    next(err);
  }
}
