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

// Santiago - Modulo Academico
router.use('/anios-academicos', require('./anioAcademico.routes'));
router.use('/areas', require('./area.routes'));
router.use('/asignaturas', require('./asignatura.routes'));
router.use('/grupos', require('./grupo.routes'));
router.use('/carga-academica', require('./cargaAcademica.routes'));

// Avila - Modulos Transversales
router.use('/comunicados', require('./comunicados.routes'));
router.use('/observador', require('./observador.routes'));
router.use('/excusas', require('./excusas.routes'));
router.use('/conceptos-contables', require('./conceptosContables.routes'));
router.use('/pagos', require('./pagos.routes'));
router.use('/elecciones', require('./elecciones.routes'));
router.use('/eventos-electorales', require('./eventoElectoral.routes'));
router.use('/votos', require('./voto.routes'));

module.exports = router;
