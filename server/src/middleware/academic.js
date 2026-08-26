const AnioAcademico = require('../models/AnioAcademico');
const Calificacion = require('../models/Calificacion');
const Actividad = require('../models/Actividad');

/**
 * RN-AUTH-02B: Middleware para forzar cambio de contraseña en primer login
 * Si el usuario tiene debeCambiarPassword = true, solo permite acceder
 * al endpoint de cambio de contraseña.
 */
const forzarCambioPassword = (req, res, next) => {
  if (req.usuario && req.usuario.credenciales && req.usuario.credenciales.debeCambiarPassword) {
    // Permitir solo el endpoint de cambio de contraseña
    const rutaPermitida = '/api/auth/password';
    if (req.method === 'PUT' && req.originalUrl === rutaPermitida) {
      return next();
    }
    return res.status(403).json({
      ok: false,
      message: 'Debes cambiar tu contraseña antes de continuar',
      debeCambiarPassword: true
    });
  }
  next();
};

/**
 * RN-CRO-03 y RN-CRO-04: Middleware para bloquear edición en período cerrado
 * Verifica si el período está cerrado antes de permitir crear/modificar actividades o notas
 */
const verificarPeriodoAbierto = async (req, res, next) => {
  try {
    const { anioAcademicoId, periodo } = req.body || req.params;

    if (!anioAcademicoId || !periodo) {
      return next(); // Si no hay info de período, permitir (el controller validará)
    }

    const anio = await AnioAcademico.findById(anioAcademicoId);
    if (!anio) {
      return next();
    }

    // Buscar el período en el cronograma
    const periodoData = anio.cronograma?.periodos?.find(
      p => p.numero === parseInt(periodo)
    );

    if (!periodoData) {
      return next(); // Si no existe el período en el cronograma, permitir
    }

    // RN-CRO-03: Si el período está cerrado, bloquear
    if (periodoData.estado === 'cerrado') {
      return res.status(403).json({
        ok: false,
        message: `El período ${periodo} está cerrado. No se permiten modificaciones.`,
        periodo: parseInt(periodo),
        estado: 'cerrado'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que el año académico esté activo
 * Bloquea operaciones si el año no está en estado 'activo'
 */
const verificarAnioActivo = async (req, res, next) => {
  try {
    const anioAcademicoId = req.body?.anioAcademicoId || req.params?.anioAcademicoId;

    if (!anioAcademicoId) {
      return next();
    }

    const anio = await AnioAcademico.findById(anioAcademicoId);
    if (!anio) {
      return next();
    }

    if (anio.estado !== 'activo') {
      return res.status(403).json({
        ok: false,
        message: `El año académico ${anio.anio} no está activo. Estado: ${anio.estado}`,
        estado: anio.estado
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  forzarCambioPassword,
  verificarPeriodoAbierto,
  verificarAnioActivo
};
