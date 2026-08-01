const { Router } = require('express');
const router = Router();
const controller = require('../controllers/prematricula.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.post('/', protect, authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.create);
router.put('/:id', protect, authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.update);
router.delete('/:id', protect, authorize('rector', 'admin', 'secretaria'), controller.remove);
router.put('/:id/aprobar', protect, authorize('rector', 'admin', 'secretaria'), controller.aprobar);
router.put('/:id/rechazar', protect, authorize('rector', 'admin', 'secretaria'), controller.rechazar);

module.exports = router;
