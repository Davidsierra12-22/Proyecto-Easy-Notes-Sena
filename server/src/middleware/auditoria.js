const Bitacora = require('../models/Bitacora');

const registrarAccion = (accion, coleccion) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      res.json = originalJson;

      if (body && body.ok !== false && req.usuario) {
        const log = {
          institucionId: req.usuario.institucionId,
          nucleoId: req.usuario.nucleoId,
          usuarioId: req.usuario._id,
          accion,
          coleccion,
          registroId: req.params.id || (body.data && body.data._id) || null,
          detalle: `${accion} en ${coleccion}`,
          direccionIp: req.ip,
          metodo: req.method,
          ruta: req.originalUrl
        };

        if (req.method === 'PUT' || req.method === 'DELETE') {
          log.cambios = { datos: body.data || body };
        }

        Bitacora.create(log).catch(err =>
          console.error('Error al registrar en bitacora:', err.message)
        );
      }

      return originalJson(body);
    };

    next();
  };
};

module.exports = { registrarAccion };
