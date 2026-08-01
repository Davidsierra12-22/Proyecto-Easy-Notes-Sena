const { Router } = require('express');
const router = Router();
const controller = require('../controllers/bitacora.controller');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.get('/', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECTOR, ROLES.COORDINADOR), controller.getAll);
router.get('/usuario/:usuarioId', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECTOR, ROLES.COORDINADOR), controller.getByUsuario);
router.get('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECTOR, ROLES.COORDINADOR), controller.getById);

module.exports = router;
