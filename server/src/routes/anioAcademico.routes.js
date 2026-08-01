const express = require('express');
const router = express.Router();
const controller = require('../controllers/anioAcademico.controller');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.put('/:id/activar', controller.activar);
router.put('/:id/cerrar', controller.cerrar);

module.exports = router;