const express = require('express');
const router = express.Router();
const controller = require('../controllers/anioAcademico.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.create);
router.put('/:id', authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.update);
router.delete('/:id', authorize('rector', 'admin'), controller.remove);

router.put('/:id/activar', authorize('rector', 'admin', 'coordinador'), controller.activar);
router.put('/:id/cerrar', authorize('rector', 'admin', 'coordinador'), controller.cerrar);

module.exports = router;