const { Router } = require('express');
const router = Router();
const controller = require('../controllers/direccionNucleo.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('crear_direccion_nucleo', 'DireccionesNucleo'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('editar_direccion_nucleo', 'DireccionesNucleo'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('eliminar_direccion_nucleo', 'DireccionesNucleo'), controller.remove);

module.exports = router;
