const { Router } = require('express');
const router = Router();
const controller = require('../controllers/bitacora.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, authorize(...PERMISOS.INSTITUCIONAL), controller.getAll);
router.get('/usuario/:usuarioId', protect, reglas.usuarioId, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.getByUsuario);
router.get('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.getById);
router.delete('/limpiar', protect, reglas.mesesLimpieza, validar, authorize(...PERMISOS.SOLO_ADMIN), controller.limpiar);

module.exports = router;
