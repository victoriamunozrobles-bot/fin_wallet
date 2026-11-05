import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { resetDemoData } from "./seedData.js";

try {
  await connectDatabase();
  await resetDemoData();
  console.info("Datos de demostración cargados.");
} catch (error) {
  console.error("No se pudo cargar el seed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
