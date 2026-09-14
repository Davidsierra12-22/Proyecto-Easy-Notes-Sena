const { Router } = require('express');
const { protect, autorizarAccesoEstudiante } = require('../middleware/auth');
const { reglas, validar } = require('../middleware/validar');
const { heavyQueryLimiter } = require('../middleware/security');
const CertificadoService = require('../services/certificadoService');
const PDFService = require('../services/pdfService');
const { htmlCertificado } = require('../services/documentoPdfService');

const router = Router();

const contexto = (req) => ({
  estudianteId: req.params.estudianteId,
  anioAcademicoId: req.params.anioAcademicoId,
  institucionId: req.usuario.institucionId
});

const getCertificado = async (req, res) => {
  try {
    const data = await CertificadoService.generarCertificado(contexto(req));
    res.json({ ok: true, data, message: 'Certificado generado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar certificado', error: error.message });
  }
};

const getCertificadoPdf = async (req, res) => {
  try {
    const data = await CertificadoService.generarCertificado(contexto(req));
    const html = htmlCertificado({ certificado: data, institucion: data.institucion });
    const pdf = await PDFService.renderPdf(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificado-estudio.pdf"');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar certificado PDF', error: error.message });
  }
};

const acceso = [reglas.estudianteId, reglas.anioAcademicoId, validar, autorizarAccesoEstudiante(), heavyQueryLimiter];

router.get('/:estudianteId/anio/:anioAcademicoId/pdf', protect, ...acceso, getCertificadoPdf);
router.get('/:estudianteId/anio/:anioAcademicoId', protect, ...acceso, getCertificado);

module.exports = router;