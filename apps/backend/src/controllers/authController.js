import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Category from "../models/Category.js";
import PaymentMethod from "../models/PaymentMethod.js";
import User from "../models/User.js";
import { DEMO_EMAIL, ensureDemoAccount } from "../seeds/demoAccount.js";
import { claimUnassignedData, prepareUserIndexes } from "../services/userDataMigration.js";
import { asyncHandler, httpError, inTransaction } from "../utils/asyncHandler.js";
import { jwtSecret } from "../middleware/authMiddleware.js";

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  currency: user.currency,
});

function issueSession(user, res) {
  const token = jwt.sign({}, jwtSecret(), { subject: String(user._id), expiresIn: "7d" });
  res.json({ token, user: publicUser(user) });
}

export const signUp = asyncHandler(async (req, res) => {
  jwtSecret();
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const currency = req.body.currency ?? "CLP";
  if (name.length < 1 || name.length > 80) throw httpError(400, "Ingresa un nombre de hasta 80 caracteres.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw httpError(400, "Ingresa un correo electrónico válido.");
  if (password.length < 6 || password.length > 128) throw httpError(400, "La contraseña debe tener entre 6 y 128 caracteres.");
  if (!["CLP", "USD"].includes(currency)) throw httpError(400, "La moneda seleccionada no es válida.");
  await prepareUserIndexes();
  const isFirstUser = await User.countDocuments({ email: { $ne: DEMO_EMAIL } }) === 0;
  if (await User.exists({ email })) throw httpError(409, "Ya existe una cuenta con ese correo.");

  const user = await inTransaction(async (session) => {
    const [created] = await User.create([{
      name, email, passwordHash: await bcrypt.hash(password, 12), currency,
    }], { session });
    if (isFirstUser) await claimUnassignedData(created._id, session);
    await createUserDefaults(created._id, session);
    return created;
  });
  res.status(201);
  issueSession(user, res);
});

export const login = asyncHandler(async (req, res) => {
  jwtSecret();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw httpError(401, "El correo o la contraseña no coinciden.");
  }
  issueSession(user, res);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name || name.length > 80) throw httpError(400, "Ingresa un nombre de hasta 80 caracteres.");
    updates.name = name;
  }
  if (req.body.currency !== undefined) {
    if (!["CLP", "USD", "ARS", "MXN", "EUR"].includes(req.body.currency)) throw httpError(400, "La moneda seleccionada no es válida.");
    updates.currency = req.body.currency;
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ user: publicUser(user) });
});

export const logout = (_req, res) => {
  res.json({ message: "Sesión cerrada." });
};

async function createUserDefaults(userId, session) {
  const categories = [
    { userId, name: "Comida", type: "expense", icon: "🥑", color: "#FFE5EC" },
    { userId, name: "Hogar", type: "expense", icon: "🏡", color: "#F3E8FF" },
    { userId, name: "Transporte", type: "expense", icon: "🚲", color: "#E2F5EA" },
    { userId, name: "Salario", type: "income", icon: "✦", color: "#E2F5EA" },
    { userId, name: "Freelance", type: "income", icon: "✿", color: "#F3E8FF" },
  ];
  const existingCategories = await Category.find({ userId }).select("name type").session(session).lean();
  const categoryKeys = new Set(existingCategories.map((category) => `${category.name}:${category.type}`));
  const missingCategories = categories.filter((category) => !categoryKeys.has(`${category.name}:${category.type}`));
  if (missingCategories.length) await Category.insertMany(missingCategories, { session });
  const methods = [
    { userId, name: "Efectivo", type: "cash", icon: "◉", color: "#FFF0E5" },
    { userId, name: "Cuenta principal", type: "bank", icon: "▣", color: "#E2F5EA" },
    { userId, name: "Tarjeta de débito", type: "debit", icon: "▣", color: "#F3E8FF" },
  ];
  const existingMethods = await PaymentMethod.find({ userId }).select("name").session(session).lean();
  const methodNames = new Set(existingMethods.map((method) => method.name));
  const missingMethods = methods.filter((method) => !methodNames.has(method.name));
  if (missingMethods.length) await PaymentMethod.insertMany(missingMethods, { session });
}

export const loginDemo = asyncHandler(async (_req, res) => {
  if (process.env.NODE_ENV === "production") throw httpError(404, "La cuenta demo no está disponible.");
  issueSession(await ensureDemoAccount(), res);
});
