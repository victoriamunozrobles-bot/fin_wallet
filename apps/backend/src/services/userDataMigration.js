import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import Debt from "../models/Debt.js";
import PaymentMethod from "../models/PaymentMethod.js";
import RecurringPayment from "../models/RecurringPayment.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";

const legacyIndexes = [
  [Category, { name: 1, type: 1 }],
  [PaymentMethod, { name: 1 }],
  [Budget, { categoryId: 1, month: 1, year: 1 }],
];

const userModels = [Category, PaymentMethod, Transaction, Budget, SavingsGoal, RecurringPayment, Debt];

export async function prepareUserIndexes() {
  for (const [Model, keys] of legacyIndexes) {
    const collectionExists = await Model.db.db.listCollections({ name: Model.collection.name }, { nameOnly: true }).hasNext();
    if (!collectionExists) continue;
    const indexes = await Model.collection.indexes();
    const legacy = indexes.find((index) => index.unique
      && Object.keys(index.key).length === Object.keys(keys).length
      && Object.entries(keys).every(([key, direction]) => index.key[key] === direction));
    if (legacy) await Model.collection.dropIndex(legacy.name);
  }
}

export async function claimUnassignedData(userId, session) {
  for (const Model of userModels) {
    const collectionExists = await Model.db.db.listCollections({ name: Model.collection.name }, { nameOnly: true }).hasNext();
    if (!collectionExists) continue;
    await Model.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId } },
      { session },
    );
  }
}
