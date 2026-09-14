const { Router } = require('express');
const router = Router();
const controller = require('../controllers/prematricula.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

// Rutas públicas (MT-003): prematrícula online sin autenticación
router.get('/periodo', controller.periodoAbierto);
router.post('/solicitar', writeLimiter, controller.solicitarPublico);
router.get('/estado/:documento', controller.consultarEstadoPublico);

router.get('/', protect, controller.getAll);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('crear_prematricula', 'Prematriculas'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('editar_prematricula', 'Prematriculas'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_prematricula', 'Prematriculas'), controller.remove);
router.put('/:id/aprobar', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('aprobar_prematricula', 'Prematriculas'), controller.aprobar);
router.put('/:id/rechazar', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('rechazar_prematricula', 'Prematriculas'), controller.rechazar);

module.exports = router;
