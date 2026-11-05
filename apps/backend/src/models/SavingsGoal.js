import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  targetAmount: { type: Number, required: true, min: 0.01 },
  currentAmount: { type: Number, default: 0, min: 0 },
  icon: { type: String, default: "✿", trim: true },
  color: { type: String, default: "#FF4D8D", match: /^#[0-9A-Fa-f]{6}$/ },
  deadline: { type: Date },
}, { timestamps: true });

export default mongoose.models.SavingsGoal ?? mongoose.model("SavingsGoal", savingsGoalSchema);
