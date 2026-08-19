const { Router } = require('express');
const { body } = require('express-validator');
const router = Router();
const controller = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validar, reglas } = require('../middleware/validar');

router.post('/login', [
  reglas.usuario,
  reglas.password
], validar, controller.login);

router.get('/me', protect, controller.me);

router.put('/password', protect, [
  body('passwordActual').notEmpty().withMessage('Password actual requerido'),
  body('passwordNueva').isLength({ min: 6 }).withMessage('Password nueva minimo 6 caracteres')
], validar, controller.cambiarPassword);

module.exports = router;
