const { Router } = require('express');
const router = Router();
const { upload } = require('../middleware/upload');
const { subirLogo, subirFirmaRector } = require('../controllers/upload.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter } = require('../middleware/security');

router.post('/:id/logo', protect, writeLimiter, authorize(...PERMISOS.DIRECCION, ...PERMISOS.NUCLEO), upload.single('archivo'), registrarAccion('subir_logo', 'Instituciones'), subirLogo);
router.post('/:id/firma-rector', protect, writeLimiter, authorize(...PERMISOS.DIRECCION), upload.single('archivo'), registrarAccion('subir_firma_rector', 'Instituciones'), subirFirmaRector);

module.exports = router;
