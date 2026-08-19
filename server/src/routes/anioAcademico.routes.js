const express = require('express');
const router = express.Router();
const controller = require('../controllers/anioAcademico.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');

router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', reglas.idMongo, validar, controller.getById);
router.post('/', authorize(...PERMISOS.ACADEMICO), controller.create);
router.put('/:id', reglas.idMongo, validar, authorize(...PERMISOS.ACADEMICO), controller.update);
router.delete('/:id', reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), controller.remove);

router.put('/:id/activar', reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.activar);
router.put('/:id/cerrar', reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), controller.cerrar);

module.exports = router;