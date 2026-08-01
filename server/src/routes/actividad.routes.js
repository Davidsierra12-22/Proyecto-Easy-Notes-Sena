const { Router } = require('express');
const router = Router();
const controller = require('../controllers/actividad.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.getAll);
router.get('/grupo/:grupoId/periodo/:periodo', protect, controller.getByGrupoPeriodo);
router.get('/:id', protect, controller.getById);
router.post('/', protect, authorize('docente', 'coordinador', 'rector', 'admin'), controller.create);
router.put('/:id', protect, authorize('docente', 'coordinador', 'rector', 'admin'), controller.update);
router.delete('/:id', protect, authorize('coordinador', 'rector', 'admin'), controller.remove);

module.exports = router;
