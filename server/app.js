require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const {
  sanitizeInput,
  preventHpp,
  validateContentType,
  detectSuspiciousPatterns
} = require('./src/middleware/security');

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 200;

// 1. CORS
app.use(cors({ origin: CORS_ORIGIN }));

// 2. Seguridad HTTP headers
app.use(helmet());

// 3. Rate limiting global
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { ok: false, message: 'Demasiadas peticiones, intenta mas tarde' }
}));

// 4. Sanitización contra NoSQL injection
app.use(sanitizeInput);

// 5. Protección contra HPP (HTTP Parameter Pollution)
app.use(preventHpp);

// 6. Detección de patrones sospechosos
app.use(detectSuspiciousPatterns);

// 7. Validación de Content-Type
app.use(validateContentType);

// 8. Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

module.exports = app;
