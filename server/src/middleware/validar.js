const { validationResult, body, param, query } = require('express-validator');
const { MENSAJES } = require('../config/constants');

const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: MENSAJES.PARAMETROS_INVALIDOS,
      errores: errores.array().map(e => ({ campo: e.path, mensaje: e.msg }))
    });
  }
  next();
};

const reglas = {
  documento: body('documento').trim().isLength({ min: 5, max: 15 }).withMessage('Documento: 5-15 caracteres'),
  documentoParam: param('documento').trim().isLength({ min: 5, max: 15 }).withMessage('Documento: 5-15 caracteres'),
  email: body('email').optional().isEmail().withMessage('Email invalido'),
  idMongo: param('id').isMongoId().withMessage('ID invalido'),
  estudianteId: param('estudianteId').isMongoId().withMessage('Estudiante invalido'),
  anioAcademicoId: param('anioAcademicoId').isMongoId().withMessage('Año academico invalido'),
  periodo: param('periodo').isInt({ min: 1, max: 5 }).withMessage('Periodo entre 1 y 5'),
  tipoBoletin: param('tipo').isIn(['acumulativo', 'corto', 'descriptivo', 'final', 'preescolar']).withMessage('Tipo de boletin invalido'),
  pagina: query('page').optional().isInt({ min: 1 }).withMessage('Pagina debe ser entero positivo'),
  busqueda: query('q').optional().isLength({ max: 50 }).withMessage('Busqueda maximo 50 caracteres'),
  nota: body('nota').optional().isFloat({ min: 0, max: 5 }).withMessage('Nota entre 0 y 5'),
  usuario: body('usuario').trim().notEmpty().withMessage('Usuario es requerido'),
  password: body('password').isLength({ min: 6 }).withMessage('Password minimo 6 caracteres')
};

module.exports = { validar, reglas };
