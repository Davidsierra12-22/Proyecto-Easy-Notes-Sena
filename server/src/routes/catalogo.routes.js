const { Router } = require('express');
const router = Router();
const controller = require('../controllers/catalogo.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.get('/tipo/:tipo', protect, controller.getByTipo);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.DIRECCION), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.remove);

module.exports = router;
