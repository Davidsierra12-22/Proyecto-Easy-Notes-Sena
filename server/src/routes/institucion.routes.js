const { Router } = require('express');
const router = Router();
const controller = require('../controllers/institucion.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.get('/:id/configuracion', protect, reglas.idMongo, validar, controller.getConfiguracion);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('crear_institucion', 'Instituciones'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('editar_institucion', 'Instituciones'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('eliminar_institucion', 'Instituciones'), controller.remove);

module.exports = router;
