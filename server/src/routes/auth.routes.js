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

router.post('/recuperar-password', [
  reglas.documento
], validar, controller.recuperarPassword);

router.put('/restablecer-password', [
  body('token').notEmpty().withMessage('Token requerido'),
  body('nuevaPassword').isLength({ min: 6 }).withMessage('Password minimo 6 caracteres')
], validar, controller.restablecerPassword);

module.exports = router;
