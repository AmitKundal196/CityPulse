const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  if (!env.mongoUri) {
    console.warn('[DB Warning] MONGODB_URI is empty. Operating without database connection.');
    return false;
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[DB Success] MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy single-field index on feedstatuses if present
    try {
      await mongoose.connection.collection('feedstatuses').dropIndex('source_1');
      console.log('[DB Info] Dropped legacy feedstatuses source_1 index for multi-city support.');
    } catch (e) {
      // Index already dropped or not present
    }

    return true;
  } catch (error) {
    console.warn(`[DB Warning] MongoDB Connection Failed: ${error.message}`);
    console.warn('[DB Warning] Server running in fallback mode without active database connection.');
    return false;
  }
};

module.exports = connectDB;
