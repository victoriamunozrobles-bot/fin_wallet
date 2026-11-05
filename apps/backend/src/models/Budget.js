import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  limitAmount: { type: Number, required: true, min: 0.01 },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2000, max: 9999 },
  alertThreshold: { type: Number, default: 80, min: 1, max: 99 },
}, { timestamps: true });

budgetSchema.index({ categoryId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Budget ?? mongoose.model("Budget", budgetSchema);
