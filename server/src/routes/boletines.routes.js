const { Router } = require('express');
const router = Router();
const ReporteService = require('../services/reporteService');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { heavyQueryLimiter } = require('../middleware/security');

router.get('/acumulativo/:estudianteId/anio/:anioAcademicoId', protect, heavyQueryLimiter, async (req, res) => {
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

router.get('/corto/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, heavyQueryLimiter, async (req, res) => {
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

router.get('/descriptivo/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, heavyQueryLimiter, async (req, res) => {
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

router.get('/final/:estudianteId/anio/:anioAcademicoId', protect, heavyQueryLimiter, async (req, res) => {
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

router.get('/preescolar/:estudianteId/anio/:anioAcademicoId/periodo/:periodo', protect, heavyQueryLimiter, async (req, res) => {
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
