const { Router } = require('express');
const router = Router();
const controller = require('../controllers/nucleo.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, heavyQueryLimiter } = require('../middleware/security');

router.get('/instituciones', protect, heavyQueryLimiter, authorize(...PERMISOS.NUCLEO), controller.getInstituciones);
router.post('/instituciones', protect, writeLimiter, authorize(...PERMISOS.NUCLEO), registrarAccion('crear_institucion_nucleo', 'Instituciones'), controller.crearInstitucion);
router.post('/instituciones/:id/admin', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.NUCLEO), registrarAccion('crear_admin_inicial', 'Usuarios'), controller.crearAdminInicial);
router.get('/estadisticas', protect, heavyQueryLimiter, authorize(...PERMISOS.NUCLEO), controller.estadisticas);
router.get('/estadisticas/:id', protect, reglas.idMongo, validar, heavyQueryLimiter, authorize(...PERMISOS.NUCLEO), controller.estadisticasInstitucion);
router.get('/comparativo', protect, heavyQueryLimiter, authorize(...PERMISOS.NUCLEO), controller.comparativo);
router.get('/reportes/:tipo', protect, heavyQueryLimiter, authorize(...PERMISOS.NUCLEO), controller.reportes);

module.exports = router;