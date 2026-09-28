const ReporteService = require('./reporteService');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');
const AnioAcademico = require('../models/AnioAcademico');
const Matricula = require('../models/Matricula');

const buscarFirmante = async ({ rectorId, secretariaId, institucionId }) => {
  const [rector, secretaria] = await Promise.all([
    rectorId
      ? Usuario.findById(rectorId).select('nombres apellidos firma')
      : Usuario.findOne({ institucionId, tipoPerfil: 'rector', estado: 'activo' }).select('nombres apellidos firma'),
    secretariaId
      ? Usuario.findById(secretariaId).select('nombres apellidos firma')
      : Usuario.findOne({ institucionId, tipoPerfil: 'secretaria', estado: 'activo' }).select('nombres apellidos firma')
  ]);

  const formatear = (u) => (u ? { nombre: `${u.nombres} ${u.apellidos}`, firma: u.firma || null } : { nombre: '', firma: null });

  return { rector: formatear(rector), secretaria: formatear(secretaria) };
};

class CertificadoService {
  static async generarCertificado({ estudianteId, anioAcademicoId, institucionId }) {
    const [estudiante, institucion, anio, final, matricula] = await Promise.all([
      Usuario.findById(estudianteId).select('nombres apellidos documento tipoDocumento'),
      Institucion.findById(institucionId).select('nombre direccion dane icfes logo rectorId secretariaId'),
      AnioAcademico.findById(anioAcademicoId),
      ReporteService.generarBoletinFinal({ estudianteId, anioAcademicoId, institucionId }),
      Matricula.findOne({ estudianteId, anioAcademicoId, institucionId, estado: 'activa' }).populate('grupoId', 'nombre')
    ]);

    const institucionIdResuelto = institucion?._id || institucionId;
    const firmantes = await buscarFirmante({
      rectorId: institucion?.rectorId,
      secretariaId: institucion?.secretariaId,
      institucionId: institucionIdResuelto
    });

    return {
      tipo: 'certificado',
      institucion,
      estudiante,
      anio: anio?.anio || anioAcademicoId,
      grado: matricula?.grupoId?.nombre || '',
      promedioGeneral: final?.resumen?.promedioGeneral ?? 0,
      areasPerdidas: final?.resumen?.areasPerdidas ?? 0,
      promovido: final?.resumen?.promovido ?? null,
      asignaturas: final?.resumen?.totalAsignaturas ?? 0,
      firmantes
    };
  }
}

module.exports = CertificadoService;