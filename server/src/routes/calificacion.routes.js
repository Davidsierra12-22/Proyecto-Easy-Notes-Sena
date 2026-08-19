const { Router } = require('express');
const router = Router();
const controller = require('../controllers/calificacion.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.post('/masivo', protect, authorize(...PERMISOS.DOCENTE), controller.guardarNotas);
router.get('/grupo/:grupoId/asignatura/:asignaturaId/periodo/:periodo', protect, controller.getByGrupoAsignaturaPeriodo);
router.get('/estudiante/:estudianteId/anio/:anioAcademicoId', protect, controller.getBoletin);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.DOCENTE), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DOCENTE), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.remove);

module.exports = router;
