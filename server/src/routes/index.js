const router = require('express').Router();

// Yorman - Infraestructura y Setup
router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/bitacora', require('./bitacora.routes'));

// Sneider - Modulo Institucional
router.use('/instituciones', require('./institucion.routes'));
router.use('/sedes', require('./sede.routes'));
router.use('/nucleos', require('./direccionNucleo.routes'));
router.use('/solicitudes-registro', require('./solicitudRegistro.routes'));
router.use('/catalogos', require('./catalogo.routes'));

// Martin - Matricula y Calificaciones
router.use('/prematriculas', require('./prematricula.routes'));
router.use('/matriculas', require('./matricula.routes'));
router.use('/indicadores', require('./indicador.routes'));
router.use('/actividades', require('./actividad.routes'));
router.use('/calificaciones', require('./calificacion.routes'));

module.exports = router;
