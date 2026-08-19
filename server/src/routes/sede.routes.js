const { Router } = require('express');
const router = Router();
const controller = require('../controllers/sede.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.INSTITUCIONAL), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.remove);

module.exports = router;
