import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠  No MONGODB_URI set — running in in-memory simulation mode (no persistence)');
    return; // graceful: simulator still runs, no DB writes
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected to', uri.replace(/\/\/[^@]+@/, '//***@'));
  } catch (err) {
    console.warn('⚠  MongoDB connection failed — running in simulation-only mode:', err.message);
    // Non-fatal: app continues without persistence
  }
}
