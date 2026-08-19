const { Router } = require('express');
const router = Router();
const controller = require('../controllers/calificacion.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');

router.get('/', protect, controller.getAll);
router.post('/masivo', protect, authorize(...PERMISOS.DOCENTE), registrarAccion('crear_calificacion_masiva', 'Calificaciones'), controller.guardarNotas);
router.get('/grupo/:grupoId/asignatura/:asignaturaId/periodo/:periodo', protect, controller.getByGrupoAsignaturaPeriodo);
router.get('/estudiante/:estudianteId/anio/:anioAcademicoId', protect, controller.getBoletin);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.DOCENTE), registrarAccion('crear_calificacion', 'Calificaciones'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DOCENTE), registrarAccion('editar_calificacion', 'Calificaciones'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('eliminar_calificacion', 'Calificaciones'), controller.remove);

module.exports = router;
