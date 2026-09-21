const serverless = require('serverless-http');
const app = require('../app');
const mongoose = require('mongoose');

let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    isConnected = true;
    console.log('[Vercel] MongoDB conectado');
  }
  return app(req, res);
};

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb'
  }
};
