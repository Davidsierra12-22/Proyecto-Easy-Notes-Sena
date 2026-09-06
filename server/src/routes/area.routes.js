const express = require('express');
const router = express.Router();
const controller = require('../controllers/area.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', writeLimiter, authorize(...PERMISOS.ACADEMICO), registrarAccion('crear_area', 'Areas'), controller.create);
router.put('/:id', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.ACADEMICO), registrarAccion('editar_area', 'Areas'), controller.update);
router.delete('/:id', reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_area', 'Areas'), controller.remove);

module.exports = router;
