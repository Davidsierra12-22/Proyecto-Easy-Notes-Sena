require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`[OK] MongoDB Conectado: ${mongoose.connection.host}`);
    console.log(`[INFO] Base de datos: ${mongoose.connection.name}`);
    console.log(`[INFO] Modelos registrados: ${mongoose.modelNames().length}`);
    console.log(`[INFO] JWT: ${process.env.JWT_SECRET ? 'configurado' : 'usando valor por defecto'}`);

    app.listen(PORT, () => {
      console.log(`[OK] Servidor listo en puerto ${PORT}`);
      console.log(`[OK] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[ERROR] No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
