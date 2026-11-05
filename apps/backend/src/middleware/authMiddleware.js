import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler, httpError } from "../utils/asyncHandler.js";

let ephemeralSecret;

export function jwtSecret() {
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET es obligatorio en producción.");
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString("hex");
    console.warn("JWT_SECRET no está configurado; las sesiones del API vencerán al reiniciar el backend.");
  }
  return ephemeralSecret;
}

export const authMiddleware = asyncHandler(async (req, _res, next) => {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) throw httpError(401, "Inicia sesión para continuar.");

  const secret = jwtSecret();
  let claims;
  try {
    claims = jwt.verify(token, secret);
  } catch {
    throw httpError(401, "La sesión expiró o no es válida.");
  }

  const user = await User.findById(claims.sub).select("name email currency");
  if (!user) throw httpError(401, "La cuenta asociada a esta sesión ya no existe.");
  req.user = user;
  next();
});
