import { asyncHandler, httpError } from "../utils/asyncHandler.js";

export function resourceController(Model, { beforeDelete } = {}) {
  return {
    list: asyncHandler(async (_req, res) => {
      const items = await Model.find().sort({ createdAt: -1 }).lean();
      res.json(items);
    }),
    create: asyncHandler(async (req, res) => {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    }),
    update: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) throw httpError(404, "Registro no encontrado.");
      res.json(item);
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw httpError(404, "Registro no encontrado.");
      if (beforeDelete) await beforeDelete(item);
      await item.deleteOne();
      res.status(204).end();
    }),
  };
}
