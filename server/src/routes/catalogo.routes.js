const { Router } = require('express');
const router = Router();
const controller = require('../controllers/catalogo.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, controller.getAll);
router.get('/tipo/:tipo', protect, controller.getByTipo);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('crear_catalogo', 'Catalogos'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('editar_catalogo', 'Catalogos'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.SOLO_ADMIN), registrarAccion('eliminar_catalogo', 'Catalogos'), controller.remove);

module.exports = router;
