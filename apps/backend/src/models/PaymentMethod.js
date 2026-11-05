import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  type: { type: String, enum: ["cash", "debit", "credit", "bank"], required: true },
  icon: { type: String, default: "▣", trim: true },
  color: { type: String, default: "#F3E8FF", match: /^#[0-9A-Fa-f]{6}$/ },
}, { timestamps: true });

paymentMethodSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.PaymentMethod ?? mongoose.model("PaymentMethod", paymentMethodSchema);
