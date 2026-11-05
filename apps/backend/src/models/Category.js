import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  type: { type: String, enum: ["income", "expense"], required: true },
  icon: { type: String, default: "✦", trim: true },
  color: { type: String, default: "#F3E8FF", match: /^#[0-9A-Fa-f]{6}$/ },
  isCustom: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ name: 1, type: 1 }, { unique: true });

export default mongoose.models.Category ?? mongoose.model("Category", categorySchema);
