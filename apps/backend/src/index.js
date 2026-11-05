import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 4000;

try {
  await connectDatabase();
  const server = app.listen(port, () => console.info(`Fin Wallet API escuchando en http://localhost:${port}`));
  const shutdown = async (signal) => {
    console.info(`${signal}: cerrando API...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  console.error("No se pudo iniciar Fin Wallet API:", error);
  process.exitCode = 1;
}
