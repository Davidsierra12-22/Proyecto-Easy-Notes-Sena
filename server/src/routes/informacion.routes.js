const { Router } = require('express');
const { protect, authorize } = require('../middleware/auth');
const { heavyQueryLimiter } = require('../middleware/security');
const { validar, reglas } = require('../middleware/validar');
const { generarInformacion } = require('../controllers/informacion.controller');

const router = Router();

router.get(
  '/',
  protect,
  authorize('admin', 'rector', 'coordinador'),
  reglas.anioAcademicoIdQuery,
  reglas.periodoQuery,
  validar,
  heavyQueryLimiter,
  generarInformacion
);

module.exports = router;