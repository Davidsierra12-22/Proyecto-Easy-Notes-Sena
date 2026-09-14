const express = require('express');
const router = express.Router();
const controller = require('../controllers/anioAcademico.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('crear_año_academico', 'AniosAcademicos'), controller.create);
router.put('/:id', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('editar_año_academico', 'AniosAcademicos'), controller.update);
router.delete('/:id', reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_año_academico', 'AniosAcademicos'), controller.remove);

router.put('/:id/activar', reglas.idMongo, validar, authorize(...PERMISOS.GESTION), registrarAccion('activar_año_academico', 'AniosAcademicos'), controller.activar);
router.put('/:id/cerrar', reglas.idMongo, validar, authorize(...PERMISOS.GESTION), registrarAccion('cerrar_año_academico', 'AniosAcademicos'), controller.cerrar);
router.put('/:id/cerrar-migracion', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('cerrar_migrar_año_academico', 'AniosAcademicos'), controller.cerrarConMigracion);
router.put('/:id/reabrir-periodo', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('reabrir_periodo_temporal', 'AniosAcademicos'), controller.reabrirPeriodo);
router.put('/:id/cerrar-reapertura', reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('cerrar_reapertura_temporal', 'AniosAcademicos'), controller.cerrarReapertura);

module.exports = router;