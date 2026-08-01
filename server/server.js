require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 200;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { ok: false, message: 'Demasiadas peticiones, intenta mas tarde' }
}));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Servidor EasyNotes funcionando',
    fecha: new Date().toISOString(),
    modelos: mongoose.modelNames().length
  });
});

app.use('/api', require('./src/routes/index'));

app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ ok: false, message: 'Error interno del servidor', error: err.message });
});

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
