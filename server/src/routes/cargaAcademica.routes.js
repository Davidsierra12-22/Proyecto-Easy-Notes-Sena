const express = require('express');
const router = express.Router();
const controller = require('../controllers/cargaAcademica.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get('/', controller.getAll);
router.get('/docente/:docenteId', controller.getByDocente);
router.get('/grupo/:grupoId', controller.getByGrupo);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', writeLimiter, authorize(...PERMISOS.ACADEMICO), registrarAccion('crear_carga_academica', 'CargaAcademica'), controller.create);
router.put('/:id', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.ACADEMICO), registrarAccion('editar_carga_academica', 'CargaAcademica'), controller.update);
router.delete('/:id', reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_carga_academica', 'CargaAcademica'), controller.remove);

module.exports = router;
