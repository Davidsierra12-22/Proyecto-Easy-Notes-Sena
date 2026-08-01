const router = require('express').Router();

// Martin - Matricula y Calificaciones
router.use('/prematriculas', require('./prematricula.routes'));
router.use('/matriculas', require('./matricula.routes'));
router.use('/indicadores', require('./indicador.routes'));
router.use('/actividades', require('./actividad.routes'));
router.use('/calificaciones', require('./calificacion.routes'));

module.exports = router;
