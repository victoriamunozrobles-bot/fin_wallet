import { resetDemoData } from "../seeds/seedData.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const resetSeed = asyncHandler(async (req, res) => {
  await resetDemoData(req.user._id);
  res.json({ message: "Datos de demostración restaurados." });
});
