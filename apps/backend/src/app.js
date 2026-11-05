import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import api from "./routes/index.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origen no permitido por CORS."));
  },
}));
app.use(express.json({ limit: "100kb" }));
app.get("/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));
app.use("/api", api);

app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  const status = error.status
    ?? (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  if (status >= 500) console.error("Error de API:", error);
  res.status(status).json({
    error: status >= 500 ? "Error interno del servidor." : error.message,
    ...(process.env.NODE_ENV !== "production" && status >= 500 ? { detail: error.message } : {}),
  });
});

export default app;
