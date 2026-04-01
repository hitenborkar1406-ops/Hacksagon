import mongoose from "mongoose";

/**
 * Resolve connection string from env (first non-empty).
 * Supports common names used with Atlas / hosting providers.
 */
function getMongoUri() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    process.env.DATABASE_URL,
  ].filter(Boolean);
  return candidates[0] || "";
}

export default async function connectDB() {
  const uri = getMongoUri();

  if (!uri || !String(uri).trim()) {
    throw new Error(
      "MongoDB URI missing. Set MONGODB_URI (or MONGO_URI / DATABASE_URL) in backend/.env"
    );
  }

  const opts = {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  };

  try {
    await mongoose.connect(uri, opts);
    const name = mongoose.connection.name || "(default)";
    console.log(`MongoDB connected (db: ${name})`);
  } catch (err) {
    const hint =
      err?.message?.includes("bad auth") || err?.message?.includes("authentication failed")
        ? " Check username/password in the URI and Atlas IP access list / network access."
        : "";
    console.error("MongoDB connection error:", err.message);
    throw new Error(`MongoDB connect failed: ${err.message}${hint}`);
  }
}
