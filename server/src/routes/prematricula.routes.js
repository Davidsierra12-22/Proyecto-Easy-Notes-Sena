const { Router } = require('express');
const router = Router();
const controller = require('../controllers/prematricula.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.ACADEMICO), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.ACADEMICO), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.remove);
router.put('/:id/aprobar', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.aprobar);
router.put('/:id/rechazar', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.rechazar);

module.exports = router;
