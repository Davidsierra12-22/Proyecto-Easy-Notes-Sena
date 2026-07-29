const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[OK] MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('[ERROR] Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;