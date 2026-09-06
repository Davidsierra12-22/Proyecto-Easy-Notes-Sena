const { Router } = require('express');
const router = Router();
const controller = require('../controllers/solicitudRegistro.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', writeLimiter, registrarAccion('crear_solicitud_registro', 'SolicitudesRegistro'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('editar_solicitud_registro', 'SolicitudesRegistro'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('eliminar_solicitud_registro', 'SolicitudesRegistro'), controller.remove);
router.put('/:id/aprobar', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('aprobar_solicitud_registro', 'SolicitudesRegistro'), controller.aprobar);
router.put('/:id/rechazar', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('rechazar_solicitud_registro', 'SolicitudesRegistro'), controller.rechazar);

module.exports = router;
