const { Router } = require('express');
const router = Router();
const controller = require('../controllers/usuario.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.get('/', protect, authorize(...PERMISOS.DIRECCION), controller.getAll);
router.get('/buscar/:documento', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.buscarPorDocumento);
router.get('/:id/estudiantes', protect, reglas.idMongo, validar, controller.misEstudiantes);
router.get('/:id/acudientes', protect, reglas.idMongo, validar, controller.misAcudientes);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, authorize(...PERMISOS.INSTITUCIONAL), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.remove);

module.exports = router;
