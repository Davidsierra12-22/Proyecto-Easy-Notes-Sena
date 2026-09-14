const { MENSAJES } = require('../config/constants');

// El super_admin es la Dirección de Núcleo. Solo accede a rutas de gestión
// de núcleo, colegios del núcleo, solicitudes de registro y su propia cuenta.
const RUTAS_PERMITIDAS_NUCLEO = [
  '/api/auth',
  '/api/nucleos',
  '/api/nucleo',
  '/api/solicitudes-registro',
  '/api/instituciones',
  '/api/upload'
];

const rutaPermitidaParaNucleo = (ruta) =>
  RUTAS_PERMITIDAS_NUCLEO.some((p) => ruta === p || ruta.startsWith(`${p}/`));

// Debe ejecutarse DESPUÉS de protect (requiere req.usuario cargado).
const restringirSuperAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.tipoPerfil === 'super_admin') {
    const ruta = (req.originalUrl || req.url).split('?')[0];
    if (!rutaPermitidaParaNucleo(ruta)) {
      return res.status(403).json({ ok: false, message: MENSAJES.SIN_PERMISOS });
    }
  }
  return next();
};

module.exports = { restringirSuperAdmin, rutaPermitidaParaNucleo };