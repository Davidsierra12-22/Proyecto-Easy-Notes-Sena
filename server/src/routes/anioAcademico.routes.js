const express = require('express');
const router = express.Router();
const controller = require('../controllers/anioAcademico.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');

router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', authorize(...PERMISOS.ACADEMICO), registrarAccion('crear_año_academico', 'AniosAcademicos'), controller.create);
router.put('/:id', reglas.idMongo, validar, authorize(...PERMISOS.ACADEMICO), registrarAccion('editar_año_academico', 'AniosAcademicos'), controller.update);
router.delete('/:id', reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_año_academico', 'AniosAcademicos'), controller.remove);

router.put('/:id/activar', reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('activar_año_academico', 'AniosAcademicos'), controller.activar);
router.put('/:id/cerrar', reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('cerrar_año_academico', 'AniosAcademicos'), controller.cerrar);

module.exports = router;