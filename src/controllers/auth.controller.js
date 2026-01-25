import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function signToken(admin) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    {
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role || "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * OPTION 2: Open registration for ANY user
 * - No "secret" required
 * - Creates a new Admin record (you can rename to User later)
 *
 * POST /api/auth/register
 * Body: { email, password, fullName? }
 */
export async function registerAdmin(req, res, next) {
  try {
    const { email, password, fullName } = req.body;

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Keep it compatible even if your schema doesn't have these fields
    const admin = await Admin.create({
      email: cleanEmail,
      passwordHash,
      ...(fullName !== undefined ? { fullName: String(fullName).trim() } : {}),
      ...(Admin.schema?.path?.("role") ? { role: "user" } : {}),
    });

    const token = signToken(admin);

    return res.status(201).json({
      message: "Registered successfully",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        ...(admin.fullName !== undefined ? { fullName: admin.fullName } : {}),
        ...(admin.role !== undefined ? { role: admin.role } : {}),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const admin = await Admin.findOne({ email: cleanEmail });
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
      admin: {
        id: admin._id,
        email: admin.email,
        ...(admin.fullName !== undefined ? { fullName: admin.fullName } : {}),
        ...(admin.role !== undefined ? { role: admin.role } : {}),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me (protected)
 * Requires auth middleware that sets req.user
 */
export async function me(req, res, next) {
  try {
    // Supports either {adminId,email,role} or {_id,email,role} depending on your middleware
    const adminId = req.user?.adminId || req.user?._id;

    return res.json({
      adminId,
      email: req.user?.email,
      role: req.user?.role,
    });
  } catch (err) {
    next(err);
  }
}
