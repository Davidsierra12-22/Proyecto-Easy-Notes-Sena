const express = require('express');
const router = express.Router();
const controller = require('../controllers/asignatura.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get('/', controller.getAll);
router.get('/area/:areaId', controller.getByArea);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('crear_asignatura', 'Asignaturas'), controller.create);
router.put('/:id', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('editar_asignatura', 'Asignaturas'), controller.update);
router.delete('/:id', reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_asignatura', 'Asignaturas'), controller.remove);

module.exports = router;
