import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { resetDemoData } from "./seedData.js";
import { prepareUserIndexes } from "../services/userDataMigration.js";

export const DEMO_EMAIL = "demo@finwallet.local";

export async function ensureDemoAccount({ reset = false } = {}) {
  await prepareUserIndexes();
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: "Demo",
      email: DEMO_EMAIL,
      currency: "CLP",
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
    });
    await resetDemoData(user._id);
  } else if (reset || !await Category.exists({ userId: user._id })) {
    await resetDemoData(user._id);
  }
  return user;
}
