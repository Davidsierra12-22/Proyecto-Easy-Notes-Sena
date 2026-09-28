const ReporteService = require('../services/reporteService');

const generarInformacion = async (req, res) => {
  try {
    const data = await ReporteService.generarCuadroHonor({
      anioAcademicoId: req.query.anioAcademicoId,
      institucionId: req.usuario.institucionId,
      periodo: parseInt(req.query.periodo, 10),
      topN: parseInt(req.query.topN, 10) || 3
    });
    res.json({ ok: true, data, message: 'Información generada' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar la información', error: error.message });
  }
};

module.exports = { generarInformacion };