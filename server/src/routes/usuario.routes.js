const { Router } = require('express');
const router = Router();
const controller = require('../controllers/usuario.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.get('/', protect, authorize(...PERMISOS.DIRECCION), controller.getAll);
router.get('/buscar/:documento', protect, reglas.documentoParam, validar, authorize(...PERMISOS.DIRECCION), controller.buscarPorDocumento);
router.get('/:id/estudiantes', protect, reglas.idMongo, validar, controller.misEstudiantes);
router.get('/:id/acudientes', protect, reglas.idMongo, validar, controller.misAcudientes);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('crear_usuario', 'Usuarios'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('editar_usuario', 'Usuarios'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_usuario', 'Usuarios'), controller.remove);

module.exports = router;
