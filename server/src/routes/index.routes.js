const express = require('express');
const router = express.Router();

router.use('/anio-academico', require('./anioAcademico.routes'));
router.use('/area', require('./area.routes'));
router.use('/asignatura', require('./asignatura.routes'));
router.use('/grupo', require('./grupo.routes'));
router.use('/carga-academica', require('./cargaAcademica.routes'));

module.exports = router;