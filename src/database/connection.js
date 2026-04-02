const mongoose = require('mongoose');

// ── Atlas-optimised connection options ────────────────────────────────────────
// keepAlive + serverSelectionTimeoutMS are important for Atlas free tier
// which can be slow to cold-start a connection.
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 5,                   // keep pool small — free tier limit
  serverSelectionTimeoutMS: 10000,  // wait up to 10s before throwing
  socketTimeoutMS: 45000,           // close idle sockets after 45s
  family: 4                         // force IPv4 (avoids some Atlas DNS issues)
};

/**
 * Connect to MongoDB Atlas.
 * Call this once at application startup.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, MONGO_OPTIONS);
    console.log(`✅  MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌  MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// ── Connection event listeners ────────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected. Attempting to reconnect…');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄  MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌  MongoDB runtime error:', err.message);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑  MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌  Error closing MongoDB connection:', err.message);
    process.exit(1);
  }
});

module.exports = connectDB;
