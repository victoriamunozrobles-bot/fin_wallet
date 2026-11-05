import mongoose from "mongoose";

const recurringPaymentSchema = new mongoose.Schema({
  serviceName: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0.01 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  paymentMethodId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod", required: true },
  billingDay: { type: Number, required: true, min: 1, max: 31 },
  active: { type: Boolean, default: true },
  lastBilledPeriod: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.models.RecurringPayment ?? mongoose.model("RecurringPayment", recurringPaymentSchema);
