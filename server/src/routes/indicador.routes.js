const { Router } = require('express');
const router = Router();
const controller = require('../controllers/indicador.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, controller.getAll);
router.get('/asignatura/:asignaturaId/periodo/:periodo', protect, controller.getByAsignaturaPeriodo);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.DOCENTE), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DOCENTE), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.remove);

module.exports = router;
