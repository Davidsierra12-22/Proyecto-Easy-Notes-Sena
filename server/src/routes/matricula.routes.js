const { Router } = require('express');
const router = Router();
const controller = require('../controllers/matricula.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/grupo/:grupoId', protect, controller.getByGrupo);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.ACADEMICO), registrarAccion('crear_matricula', 'Matriculas'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.ACADEMICO), registrarAccion('editar_matricula', 'Matriculas'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_matricula', 'Matriculas'), controller.remove);
router.put('/:id/retirar', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('retirar_matricula', 'Matriculas'), controller.retirar);
router.put('/:id/promover', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('promover_matricula', 'Matriculas'), controller.promover);

module.exports = router;
