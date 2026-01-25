import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, default: "" },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", AdminSchema);
