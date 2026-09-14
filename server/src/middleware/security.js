const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Rate limiting para login (brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  skipSuccessfulRequests: true,
  message: { ok: false, message: 'Demasiados intentos de login, espera 15 minutos' }
});

// Rate limiting para recuperación de contraseña
const passwordRecoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 solicitudes máximo
  message: { ok: false, message: 'Demasiadas solicitudes de recuperación, espera 1 hora' }
});

// Rate limiting para endpoints de escritura (crear/modificar)
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 peticiones por minuto
  message: { ok: false, message: 'Demasiadas peticiones de escritura, intenta más tarde' }
});

// Rate limiting para endpoints de eliminación
const deleteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 eliminaciones máximo
  message: { ok: false, message: 'Demasiadas eliminaciones, intenta más tarde' }
});

// Rate limiting para consultas pesadas (reportes, boletines)
const heavyQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 consultas por minuto
  message: { ok: false, message: 'Demasiadas consultas pesadas, intenta más tarde' }
});

// Sanitización contra NoSQL injection
const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Campo sanitizado: ${key} en ${req.method} ${req.originalUrl}`);
  }
});

// Protección contra HTTP Parameter Pollution
const preventHpp = hpp();

// Middleware para validar Content-Type
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength === 0) return next();
    const contentType = req.headers['content-type'];
    if (!contentType || (
      !contentType.includes('application/json') &&
      !contentType.includes('application/x-www-form-urlencoded') &&
      !contentType.includes('multipart/form-data')
    )) {
      return res.status(415).json({
        ok: false,
        message: 'Content-Type no soportado. Usa application/json'
      });
    }
  }
  next();
};

// Middleware para detectar patrones sospechosos en URLs
const detectSuspiciousPatterns = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//,           // path traversal
    /<script/i,         // XSS
    /javascript:/i,     // javascript protocol
    /on\w+\s*=\s*(?:javascript:|alert\s*\(|confirm\s*\(|prompt\s*\(|eval\s*\(|function\s*\()/i, // event handlers con código
    /union.*select/i,   // SQL injection
    /eval\s*\(/i,       // eval injection
    /document\.cookie/i // cookie stealing
  ];

  const fullUrl = req.originalUrl + JSON.stringify(req.body || {});

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      console.warn(`[SECURITY] Patrón sospechoso detectado: ${req.method} ${req.originalUrl} desde ${req.ip}`);
      return res.status(400).json({
        ok: false,
        message: 'Solicitud rechazada por patrón sospechoso'
      });
    }
  }
  next();
};

// Middleware para limitar tamanho do body por endpoint
const bodySizeLimiter = (maxSize) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > maxSize) {
      return res.status(413).json({
        ok: false,
        message: `Payload demasiado grande. Máximo: ${Math.round(maxSize / 1024)}KB`
      });
    }
    next();
  };
};

module.exports = {
  loginLimiter,
  passwordRecoveryLimiter,
  writeLimiter,
  deleteLimiter,
  heavyQueryLimiter,
  sanitizeInput,
  preventHpp,
  validateContentType,
  detectSuspiciousPatterns,
  bodySizeLimiter
};
