const { Router } = require('express');
const router = Router();
const controller = require('../controllers/institucion.controller');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.get('/:id/configuracion', protect, controller.getConfiguracion);
router.post('/', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECTOR), controller.create);
router.put('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECTOR), controller.update);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), controller.remove);

module.exports = router;
