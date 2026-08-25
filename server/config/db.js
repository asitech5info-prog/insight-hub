const mongoose = require('mongoose');

/**
 * Global cache for Mongoose connection in serverless / multi-invocation environments.
 * Prevents multiple connections during cold/warm starts on Vercel.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!MONGODB_URI) {
    return { isConnected: false, mode: 'local-fallback', client: null };
  }

  if (cached.conn) {
    return { isConnected: true, mode: 'mongodb-cluster', client: cached.conn };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('⚡ Successfully connected to MongoDB Atlas Cluster');
      return mongooseInstance;
    }).catch((err) => {
      console.error('❌ MongoDB Atlas Connection Error:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return { isConnected: true, mode: 'mongodb-cluster', client: cached.conn };
  } catch (e) {
    return { isConnected: false, mode: 'local-fallback', error: e.message };
  }
}

module.exports = {
  connectToDatabase,
  mongoose
};
