export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function inTransaction(work) {
  const session = await (await import("mongoose")).default.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
