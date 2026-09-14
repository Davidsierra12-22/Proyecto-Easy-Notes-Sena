const express = require('express');
const router = express.Router();
const controller = require('../controllers/grupo.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get('/', controller.getAll);
router.get('/anio/:anioAcademicoId', controller.getByAnio);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('crear_grupo', 'Grupos'), controller.create);
router.put('/:id', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('editar_grupo', 'Grupos'), controller.update);
router.delete('/:id', reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_grupo', 'Grupos'), controller.remove);

module.exports = router;
