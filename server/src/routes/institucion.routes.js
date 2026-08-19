const { Router } = require('express');
const router = Router();
const controller = require('../controllers/institucion.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.get('/:id/configuracion', protect, reglas.idMongo, validar, controller.getConfiguracion);
router.post('/', protect, authorize(...PERMISOS.DIRECCION), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.remove);

module.exports = router;
