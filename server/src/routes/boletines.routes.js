const { Router } = require('express');
const router = Router();
const ReporteService = require('../services/reporteService');
const { protect, autorizarAccesoEstudiante } = require('../middleware/auth');
const { reglas, validar } = require('../middleware/validar');
const { heavyQueryLimiter } = require('../middleware/security');
const { generarPdf } = require('../controllers/boletinPdf.controller');

const conAcceso = (handler) => [reglas.estudianteId, reglas.anioAcademicoId, validar, autorizarAccesoEstudiante(), heavyQueryLimiter, handler];

const pdfBoletin = (req, res) => generarPdf(req, res, { tipo: req.params.tipo, periodo: req.params.periodo ? parseInt(req.params.periodo, 10) : undefined });

router.get('/pdf/:tipo/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, reglas.tipoBoletin, reglas.periodo, conAcceso(pdfBoletin));
router.get('/pdf/:tipo/:estudianteId/anio/:anioAcademicoId', protect, reglas.tipoBoletin, conAcceso(pdfBoletin));

router.get('/acumulativo/:estudianteId/anio/:anioAcademicoId', protect, reglas.estudianteId, reglas.anioAcademicoId, validar, autorizarAccesoEstudiante(), heavyQueryLimiter, async (req, res) => {
  try {
    const data = await ReporteService.generarBoletinAcumulativo({
      estudianteId: req.params.estudianteId,
      anioAcademicoId: req.params.anioAcademicoId,
      institucionId: req.usuario.institucionId
    });
    res.json({ ok: true, data, message: 'Boletín acumulativo generado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar boletín', error: error.message });
  }
});

router.get('/corto/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, reglas.estudianteId, reglas.anioAcademicoId, reglas.periodo, validar, autorizarAccesoEstudiante(), heavyQueryLimiter, async (req, res) => {
  try {
    const data = await ReporteService.generarBoletinCorto({
      estudianteId: req.params.estudianteId,
      anioAcademicoId: req.params.anioAcademicoId,
      institucionId: req.usuario.institucionId,
      periodo: parseInt(req.params.periodo, 10)
    });
    res.json({ ok: true, data, message: 'Boletín corto generado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar boletín', error: error.message });
  }
});

router.get('/descriptivo/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, reglas.estudianteId, reglas.anioAcademicoId, reglas.periodo, validar, autorizarAccesoEstudiante(), heavyQueryLimiter, async (req, res) => {
  try {
    const data = await ReporteService.generarBoletinDescriptivo({
      estudianteId: req.params.estudianteId,
      anioAcademicoId: req.params.anioAcademicoId,
      institucionId: req.usuario.institucionId,
      periodo: parseInt(req.params.periodo, 10)
    });
    res.json({ ok: true, data, message: 'Boletín descriptivo generado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar boletín', error: error.message });
  }
});

router.get('/final/:estudianteId/anio/:anioAcademicoId', protect, reglas.estudianteId, reglas.anioAcademicoId, validar, autorizarAccesoEstudiante(), heavyQueryLimiter, async (req, res) => {
  try {
    const data = await ReporteService.generarBoletinFinal({
      estudianteId: req.params.estudianteId,
      anioAcademicoId: req.params.anioAcademicoId,
      institucionId: req.usuario.institucionId
    });
    res.json({ ok: true, data, message: 'Boletín final generado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar boletín', error: error.message });
  }
});

router.get('/preescolar/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, reglas.estudianteId, reglas.anioAcademicoId, reglas.periodo, validar, autorizarAccesoEstudiante(), heavyQueryLimiter, async (req, res) => {
  try {
    const data = await ReporteService.generarBoletinPreescolar({
      estudianteId: req.params.estudianteId,
      anioAcademicoId: req.params.anioAcademicoId,
      institucionId: req.usuario.institucionId,
      periodo: parseInt(req.params.periodo, 10)
    });
    res.json({ ok: true, data, message: 'Boletín preescolar generado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar boletín', error: error.message });
  }
});

module.exports = router;
