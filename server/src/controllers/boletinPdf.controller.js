const PDFService = require('../services/pdfService');
const { htmlBoletin } = require('../services/documentoPdfService');
const ReporteService = require('../services/reporteService');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');
const AnioAcademico = require('../models/AnioAcademico');
const Matricula = require('../models/Matricula');

const contextoDocumento = async ({ estudianteId, anioAcademicoId, institucionId }) => {
  const [estudiante, institucion, anio, matricula] = await Promise.all([
    Usuario.findById(estudianteId).select('nombres apellidos documento'),
    Institucion.findById(institucionId).select('nombre direccion dane icfes logo'),
    AnioAcademico.findById(anioAcademicoId),
    Matricula.findOne({ estudianteId, anioAcademicoId, institucionId, estado: 'activa' }).populate('grupoId', 'nombre')
  ]);
  return { estudiante, institucion, anio, grado: matricula?.grupoId?.nombre || '' };
};

const generarBoletinDato = async (tipo, params) => {
  switch (tipo) {
    case 'acumulativo': return ReporteService.generarBoletinAcumulativo(params);
    case 'corto': return ReporteService.generarBoletinCorto(params);
    case 'descriptivo': return ReporteService.generarBoletinDescriptivo(params);
    case 'final': return ReporteService.generarBoletinFinal(params);
    case 'preescolar': return ReporteService.generarBoletinPreescolar(params);
    default: throw new Error('Tipo de boletín inválido');
  }
};

const generarPdf = async (req, res, { tipo, periodo }) => {
  try {
    const params = {
      estudianteId: req.params.estudianteId,
      anioAcademicoId: req.params.anioAcademicoId,
      institucionId: req.usuario.institucionId
    };
    if (periodo) params.periodo = periodo;

    const [boletin, ctx] = await Promise.all([
      generarBoletinDato(tipo, params),
      contextoDocumento(params)
    ]);

    const html = htmlBoletin({
      boletin,
      estudiante: ctx.estudiante,
      anio: ctx.anio,
      institucion: ctx.institucion,
      grado: ctx.grado
    });

    const pdf = await PDFService.renderPdf(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="boletin-${tipo}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar PDF', error: error.message });
  }
};

module.exports = { generarPdf };