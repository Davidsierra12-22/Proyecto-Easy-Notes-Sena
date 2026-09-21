const router = require('express').Router();
const { getAll, marcarLeida, marcarTodasLeidas, crear, eliminar } = require('../controllers/notificacion.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAll);
router.post('/', authorize('admin', 'rector', 'coordinador', 'super_admin'), crear);
router.put('/:id/leer', marcarLeida);
router.put('/leer-todas', marcarTodasLeidas);
router.delete('/:id', eliminar);

module.exports = router;
