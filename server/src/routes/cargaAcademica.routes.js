const express = require('express');
const router = express.Router();
const controller = require('../controllers/cargaAcademica.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', controller.getAll);
router.get('/docente/:docenteId', controller.getByDocente);
router.get('/grupo/:grupoId', controller.getByGrupo);
router.get('/:id', controller.getById);
router.post('/', authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.create);
router.put('/:id', authorize('rector', 'admin', 'secretaria', 'coordinador'), controller.update);
router.delete('/:id', authorize('rector', 'admin'), controller.remove);

module.exports = router;