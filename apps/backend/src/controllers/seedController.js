import { resetDemoData } from "../seeds/seedData.js";
import { asyncHandler, httpError } from "../utils/asyncHandler.js";

export const resetSeed = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const expected = process.env.SEED_RESET_TOKEN;
    const provided = req.get("x-seed-reset-token");
    if (!expected || !provided || provided !== expected) throw httpError(403, "Restaurar datos requiere un token autorizado.");
  }
  await resetDemoData();
  res.json({ message: "Datos de demostración restaurados." });
});
