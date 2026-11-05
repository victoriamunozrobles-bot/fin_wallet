import { asyncHandler, httpError } from "../utils/asyncHandler.js";

export function resourceController(Model, { beforeDelete } = {}) {
  return {
    list: asyncHandler(async (req, res) => {
      const items = await Model.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
      res.json(items);
    }),
    create: asyncHandler(async (req, res) => {
      const item = await Model.create({ ...req.body, userId: req.user._id });
      res.status(201).json(item);
    }),
    update: asyncHandler(async (req, res) => {
      const { userId: _userId, ...updates } = req.body;
      const item = await Model.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, { new: true, runValidators: true });
      if (!item) throw httpError(404, "Registro no encontrado.");
      res.json(item);
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findOne({ _id: req.params.id, userId: req.user._id });
      if (!item) throw httpError(404, "Registro no encontrado.");
      if (beforeDelete) await beforeDelete(item, req.user._id);
      await item.deleteOne();
      res.status(204).end();
    }),
  };
}
