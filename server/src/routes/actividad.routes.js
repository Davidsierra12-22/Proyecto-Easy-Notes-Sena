const { Router } = require('express');
const router = Router();
const controller = require('../controllers/actividad.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { verificarPeriodoAbierto } = require('../middleware/academic');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/grupo/:grupoId/periodo/:periodo', protect, controller.getByGrupoPeriodo);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, verificarPeriodoAbierto, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('crear_actividad', 'Actividades'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, verificarPeriodoAbierto, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('editar_actividad', 'Actividades'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('eliminar_actividad', 'Actividades'), controller.remove);

module.exports = router;
