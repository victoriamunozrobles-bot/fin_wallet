import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI. Crea un .env desde .env.example.");
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.info("MongoDB conectado.");
}
