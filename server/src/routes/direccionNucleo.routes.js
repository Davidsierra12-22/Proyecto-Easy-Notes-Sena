const { Router } = require('express');
const router = Router();
const controller = require('../controllers/direccionNucleo.controller');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.post('/', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.create);
router.put('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.update);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.remove);

module.exports = router;
