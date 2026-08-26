const { Router } = require('express');
const router = Router();
const controller = require('../controllers/calificacion.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter, heavyQueryLimiter } = require('../middleware/security');
const { verificarPeriodoAbierto } = require('../middleware/academic');

router.get('/', protect, controller.getAll);
router.post('/masivo', protect, verificarPeriodoAbierto, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('crear_calificacion_masiva', 'Calificaciones'), controller.guardarNotas);
router.get('/grupo/:grupoId/asignatura/:asignaturaId/periodo/:periodo', protect, heavyQueryLimiter, controller.getByGrupoAsignaturaPeriodo);
router.get('/estudiante/:estudianteId/anio/:anioAcademicoId', protect, heavyQueryLimiter, controller.getBoletin);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, verificarPeriodoAbierto, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('crear_calificacion', 'Calificaciones'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, verificarPeriodoAbierto, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('editar_calificacion', 'Calificaciones'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('eliminar_calificacion', 'Calificaciones'), controller.remove);

module.exports = router;
