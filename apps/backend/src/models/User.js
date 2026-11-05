import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
  passwordHash: { type: String, required: true, select: false },
  currency: { type: String, enum: ["CLP", "USD", "ARS", "MXN", "EUR"], default: "CLP" },
}, { timestamps: true });

export default mongoose.models.User ?? mongoose.model("User", userSchema);
