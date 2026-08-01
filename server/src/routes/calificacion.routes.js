const { Router } = require('express');
const router = Router();
const controller = require('../controllers/calificacion.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.getAll);
router.post('/masivo', protect, authorize('docente', 'coordinador', 'rector', 'admin'), controller.guardarNotas);
router.get('/grupo/:grupoId/asignatura/:asignaturaId/periodo/:periodo', protect, controller.getByGrupoAsignaturaPeriodo);
router.get('/estudiante/:estudianteId/anio/:anioAcademicoId', protect, controller.getBoletin);
router.get('/:id', protect, controller.getById);
router.post('/', protect, authorize('docente', 'coordinador', 'rector', 'admin'), controller.create);
router.put('/:id', protect, authorize('docente', 'coordinador', 'rector', 'admin'), controller.update);
router.delete('/:id', protect, authorize('coordinador', 'rector', 'admin'), controller.remove);

module.exports = router;
