import mongoose from "mongoose";

const debtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  direction: { type: String, enum: ["i_owe", "owed_to_me"], required: true },
  personName: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0.01 },
  dueDate: { type: Date },
  isPaid: { type: Boolean, default: false },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
}, { timestamps: true });

export default mongoose.models.Debt ?? mongoose.model("Debt", debtSchema);
