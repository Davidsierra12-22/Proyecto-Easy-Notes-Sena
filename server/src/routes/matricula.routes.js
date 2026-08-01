const { Router } = require('express');
const router = Router();
const controller = require('../controllers/matricula.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.getAll);
router.get('/grupo/:grupoId', protect, controller.getByGrupo);
router.get('/:id', protect, controller.getById);
router.post('/', protect, authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.create);
router.put('/:id', protect, authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.update);
router.delete('/:id', protect, authorize('rector', 'admin'), controller.remove);
router.put('/:id/retirar', protect, authorize('rector', 'admin', 'secretaria'), controller.retirar);
router.put('/:id/promover', protect, authorize('rector', 'admin', 'coordinador'), controller.promover);

module.exports = router;
