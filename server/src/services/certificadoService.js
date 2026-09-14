const ReporteService = require('./reporteService');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');
const AnioAcademico = require('../models/AnioAcademico');
const Matricula = require('../models/Matricula');

class CertificadoService {
  static async generarCertificado({ estudianteId, anioAcademicoId, institucionId }) {
    const [estudiante, institucion, anio, final, matricula] = await Promise.all([
      Usuario.findById(estudianteId).select('nombres apellidos documento tipoDocumento'),
      Institucion.findById(institucionId).select('nombre direccion dane icfes logo'),
      AnioAcademico.findById(anioAcademicoId),
      ReporteService.generarBoletinFinal({ estudianteId, anioAcademicoId, institucionId }),
      Matricula.findOne({ estudianteId, anioAcademicoId, institucionId, estado: 'activa' }).populate('grupoId', 'nombre')
    ]);

    return {
      tipo: 'certificado',
      institucion,
      estudiante,
      anio: anio?.anio || anioAcademicoId,
      grado: matricula?.grupoId?.nombre || '',
      promedioGeneral: final?.resumen?.promedioGeneral ?? 0,
      areasPerdidas: final?.resumen?.areasPerdidas ?? 0,
      promovido: final?.resumen?.promovido ?? null,
      asignaturas: final?.resumen?.totalAsignaturas ?? 0
    };
  }
}

module.exports = CertificadoService;