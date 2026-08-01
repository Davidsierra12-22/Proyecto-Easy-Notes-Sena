const { Router } = require('express');
const router = Router();
const controller = require('../controllers/solicitudRegistro.controller');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.post('/', controller.create);
router.put('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.update);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.remove);
router.put('/:id/aprobar', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.aprobar);
router.put('/:id/rechazar', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.rechazar);

module.exports = router;
