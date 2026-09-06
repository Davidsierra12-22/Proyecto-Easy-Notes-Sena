const { Router } = require('express');
const router = Router();
const controller = require('../controllers/indicador.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/asignatura/:asignaturaId/periodo/:periodo', protect, controller.getByAsignaturaPeriodo);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('crear_indicador', 'Indicadores'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DOCENTE), registrarAccion('editar_indicador', 'Indicadores'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('eliminar_indicador', 'Indicadores'), controller.remove);

module.exports = router;
