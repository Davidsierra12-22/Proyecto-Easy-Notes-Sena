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
 * RN-CRO-04: Si el período está en reapertura temporal, permite pero verifica expiración
 */
const verificarPeriodoAbierto = async (req, res, next) => {
  try {
    const { anioAcademicoId, periodo } = req.body || req.params;

    if (!anioAcademicoId || !periodo) {
      return next();
    }

    const anio = await AnioAcademico.findById(anioAcademicoId);
    if (!anio) {
      return next();
    }

    const periodoData = anio.cronograma?.periodos?.find(
      p => p.numero === parseInt(periodo)
    );

    if (!periodoData) {
      return next();
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

    // RN-CRO-04: Si está en reapertura temporal, verificar expiración
    if (periodoData.estado === 'abierto_temporal') {
      const ahora = new Date();
      const expiracion = periodoData.reaperturaTemporal?.fechaExpiracion;

      if (expiracion && ahora > new Date(expiracion)) {
        // La reapertura expiró — cerrar automáticamente
        periodoData.estado = 'cerrado';
        periodoData.reaperturaTemporal.activa = false;
        await anio.save();

        return res.status(403).json({
          ok: false,
          message: `La reapertura temporal del período ${periodo} ha expirado.`,
          periodo: parseInt(periodo),
          estado: 'cerrado',
          expirado: true
        });
      }

      // La reapertura sigue activa — permitir con advertencia
      res.set('X-Reapertura-Expira', expiracion?.toISOString());
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * RN-CRO-02: Middleware para verificar que estemos dentro de la ventana de recuperación
 * Verifica que la fecha actual esté entre recuperacion.inicio y recuperacion.fin del período
 */
const verificarVentanaRecuperacion = async (req, res, next) => {
  try {
    const { anioAcademicoId, periodo } = req.body || req.params;

    if (!anioAcademicoId || !periodo) {
      return next();
    }

    const anio = await AnioAcademico.findById(anioAcademicoId);
    if (!anio) {
      return next();
    }

    const periodoData = anio.cronograma?.periodos?.find(
      p => p.numero === parseInt(periodo)
    );

    if (!periodoData) {
      return next();
    }

    // Si no hay ventana de recuperación configurada, permitir (backwards compatible)
    if (!periodoData.recuperacion?.inicio || !periodoData.recuperacion?.fin) {
      return next();
    }

    const ahora = new Date();
    const inicio = new Date(periodoData.recuperacion.inicio);
    const fin = new Date(periodoData.recuperacion.fin);
    fin.setHours(23, 59, 59, 999);

    if (ahora < inicio) {
      return res.status(403).json({
        ok: false,
        message: `La ventana de recuperación del período ${periodo} aún no inicia. Fecha de inicio: ${inicio.toLocaleDateString('es-CO')}`,
        periodo: parseInt(periodo),
        recuperacionInicio: inicio,
        recuperacionFin: fin
      });
    }

    if (ahora > fin) {
      return res.status(403).json({
        ok: false,
        message: `La ventana de recuperación del período ${periodo} ha expirado. Fecha límite: ${fin.toLocaleDateString('es-CO')}`,
        periodo: parseInt(periodo),
        recuperacionInicio: inicio,
        recuperacionFin: fin
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
  verificarVentanaRecuperacion,
  verificarAnioActivo
};
