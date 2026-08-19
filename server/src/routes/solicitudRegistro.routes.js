const { Router } = require('express');
const router = Router();
const controller = require('../controllers/solicitudRegistro.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.remove);
router.put('/:id/aprobar', protect, reglas.idMongo, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.aprobar);
router.put('/:id/rechazar', protect, reglas.idMongo, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.rechazar);

module.exports = router;
