import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { ensureDemoAccount } from "./demoAccount.js";

try {
  await connectDatabase();
  const user = await ensureDemoAccount({ reset: true });
  console.info(`Datos de demostración cargados para ${user.email}.`);
} catch (error) {
  console.error("No se pudo cargar el seed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
