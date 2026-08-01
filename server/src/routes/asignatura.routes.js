const express = require('express');
const router = express.Router();
const controller = require('../controllers/asignatura.controller');

router.get('/', controller.getAll);
router.get('/area/:areaId', controller.getByArea);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;