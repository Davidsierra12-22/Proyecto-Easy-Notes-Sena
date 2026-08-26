const Calificacion = require('../models/Calificacion');
const Indicador = require('../models/Indicador');
const AnioAcademico = require('../models/AnioAcademico');
const CalificacionService = require('./calificacionService');
const PromocionService = require('./promocionService');

/**
 * Servicio de reportes y boletines
 * Reglas de negocio: RN-BOL-01 a RN-BOL-07
 */
class ReporteService {

  /**
   * RN-BOL-01: Generar boletín acumulativo
   * Muestra notas de todos los periodos cursados y promedio
   */
  static async generarBoletinAcumulativo({ estudianteId, anioAcademicoId, institucionId }) {
    const calificaciones = await Calificacion.find({
      estudianteId,
      anioAcademicoId,
      institucionId
    })
      .populate('asignaturaId', 'nombre abreviatura areaId')
      .populate('grupoId', 'nombre grado')
      .sort({ asignaturaId: 1, periodo: 1 });

    const anio = await AnioAcademico.findById(anioAcademicoId);
    const numPeriodos = anio?.configuracion?.numeroPeriodos || 4;

    // Agrupar por asignatura
    const porAsignatura = {};
    for (const cal of calificaciones) {
      const key = cal.asignaturaId?._id?.toString() || cal.asignaturaId?.toString();
      if (!key) continue;

      if (!porAsignatura[key]) {
        porAsignatura[key] = {
          asignatura: cal.asignaturaId,
          periodos: [],
          logros: []
        };
      }

      // RN-BOL-04: Marcar recuperaciones con asterisco
      const notaVigente = cal.recuperacion || cal.habilitacion || cal.nota;
      const tieneRecuperacion = cal.recuperacion != null || cal.habilitacion != null;

      porAsignatura[key].periodos.push({
        periodo: cal.periodo,
        nota: cal.nota,
        recuperacion: cal.recuperacion,
        habilitacion: cal.habilitacion,
        notaVigente,
        recuperada: tieneRecuperacion,
        observacion: cal.observacion
      });

      // RN-BOL-06: Generar logro cualitativo
      if (notaVigente != null) {
        const logro = CalificacionService.generarLogro(notaVigente);
        porAsignatura[key].logros.push({
          periodo: cal.periodo,
          logro
        });
      }
    }

    // Calcular promedio anual por asignatura
    const resultado = Object.values(porAsignatura).map(materia => {
      const notas = materia.periodos
        .map(p => p.notaVigente)
        .filter(n => n != null);

      let promedioAnual = 0;
      if (notas.length > 0) {
        promedioAnual = Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10;
      }

      return {
        asignatura: materia.asignatura,
        periodos: materia.periodos,
        promedioAnual,
        logroFinal: CalificacionService.generarLogro(promedioAnual),
        logros: materia.logros
      };
    });

    // RN-BOL-02: Ordenar alfabéticamente
    resultado.sort((a, b) => {
      const nombreA = a.asignatura?.nombre || '';
      const nombreB = b.asignatura?.nombre || '';
      return nombreA.localeCompare(nombreB);
    });

    return {
      tipo: 'acumulativo',
      estudianteId,
      anioAcademicoId,
      asignaturas: resultado,
      totalAsignaturas: resultado.length
    };
  }

  /**
   * RN-BOL-01: Generar boletín corto
   * Resumen de notas finales del periodo actual sin detalles
   */
  static async generarBoletinCorto({ estudianteId, anioAcademicoId, institucionId, periodo }) {
    const calificaciones = await Calificacion.find({
      estudianteId,
      anioAcademicoId,
      institucionId,
      periodo
    })
      .populate('asignaturaId', 'nombre abreviatura areaId')
      .populate('grupoId', 'nombre grado')
      .sort({ asignaturaId: 1 });

    const resultado = calificaciones.map(cal => {
      const notaVigente = cal.recuperacion || cal.habilitacion || cal.nota;
      const tieneRecuperacion = cal.recuperacion != null || cal.habilitacion != null;

      return {
        asignatura: cal.asignaturaId,
        periodo: cal.periodo,
        nota: cal.nota,
        notaVigente,
        recuperada: tieneRecuperacion,
        logro: CalificacionService.generarLogro(notaVigente || 0),
        observacion: cal.observacion
      };
    });

    // RN-BOL-02: Ordenar alfabéticamente
    resultado.sort((a, b) => {
      const nombreA = a.asignatura?.nombre || '';
      const nombreB = b.asignatura?.nombre || '';
      return nombreA.localeCompare(nombreB);
    });

    return {
      tipo: 'corto',
      estudianteId,
      anioAcademicoId,
      periodo,
      asignaturas: resultado,
      totalAsignaturas: resultado.length
    };
  }

  /**
   * RN-BOL-01 y RN-BOL-03: Generar boletín descriptivo
   * Incluye el detalle de indicadores y observaciones
   */
  static async generarBoletinDescriptivo({ estudianteId, anioAcademicoId, institucionId, periodo }) {
    const calificaciones = await Calificacion.find({
      estudianteId,
      anioAcademicoId,
      institucionId,
      periodo
    })
      .populate('asignaturaId', 'nombre abreviatura areaId')
      .populate('grupoId', 'nombre grado')
      .populate('indicadores.indicadorId', 'codigo descripcion peso')
      .sort({ asignaturaId: 1 });

    // RN-BOL-03: Obtener indicadores para cada asignatura
    const resultado = [];
    for (const cal of calificaciones) {
      const notaVigente = cal.recuperacion || cal.habilitacion || cal.nota;
      const tieneRecuperacion = cal.recuperacion != null || cal.habilitacion != null;

      // Obtener indicadores de la asignatura en este período
      const indicadores = await Indicador.find({
        asignaturaId: cal.asignaturaId,
        anioAcademicoId,
        periodo,
        estado: 'activo'
      }).sort({ orden: 1 });

      resultado.push({
        asignatura: cal.asignaturaId,
        periodo: cal.periodo,
        nota: cal.nota,
        notaVigente,
        recuperada: tieneRecuperacion,
        logro: CalificacionService.generarLogro(notaVigente || 0),
        observacion: cal.observacion,
        // RN-BOL-03: Solo en boletín descriptivo se muestran indicadores
        indicadores: cal.indicadores?.map(ind => ({
          indicador: ind.indicadorId,
          nota: ind.nota
        })) || [],
        indicadoresDisponibles: indicadores.map(ind => ({
          codigo: ind.codigo,
          descripcion: ind.descripcion,
          peso: ind.peso
        }))
      });
    }

    // RN-BOL-02: Ordenar alfabéticamente
    resultado.sort((a, b) => {
      const nombreA = a.asignatura?.nombre || '';
      const nombreB = b.asignatura?.nombre || '';
      return nombreA.localeCompare(nombreB);
    });

    return {
      tipo: 'descriptivo',
      estudianteId,
      anioAcademicoId,
      periodo,
      asignaturas: resultado,
      totalAsignaturas: resultado.length
    };
  }

  /**
   * RN-BOL-05: Generar boletín final de año
   * Promedio anual, puesto y veredicto de promoción
   */
  static async generarBoletinFinal({ estudianteId, anioAcademicoId, institucionId }) {
    // Obtener calificaciones de todos los períodos
    const boletinAcumulativo = await this.generarBoletinAcumulativo({
      estudianteId,
      anioAcademicoId,
      institucionId
    });

    // Evaluar promoción
    const matricula = require('../models/Matricula');
    const matriculaActiva = await matricula.findOne({
      estudianteId,
      anioAcademicoId,
      institucionId,
      estado: 'activa'
    });

    let evaluacion = null;
    if (matriculaActiva) {
      evaluacion = await PromocionService.evaluarPromocion({
        estudianteId,
        grupoId: matriculaActiva.grupoId,
        anioAcademicoId,
        institucionId
      });
    }

    // Calcular promedio general
    const promedios = boletinAcumulativo.asignaturas
      .map(a => a.promedioAnual)
      .filter(p => p > 0);
    const promedioGeneral = promedios.length > 0
      ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 10) / 10
      : 0;

    return {
      tipo: 'final',
      estudianteId,
      anioAcademicoId,
      asignaturas: boletinAcumulativo.asignaturas,
      resumen: {
        promedioGeneral,
        totalAsignaturas: boletinAcumulativo.asignaturas.length,
        promovido: evaluacion?.promovido ?? null,
        areasPerdidas: evaluacion?.areasPerdidas ?? 0,
        veredicto: evaluacion?.promovido ? 'Promovido' : 'No Promovido'
      }
    };
  }

  /**
   * RN-BOL-07: Boletín preescolar (escala cualitativa)
   */
  static async generarBoletinPreescolar({ estudianteId, anioAcademicoId, institucionId, periodo }) {
    const calificaciones = await Calificacion.find({
      estudianteId,
      anioAcademicoId,
      institucionId,
      periodo
    })
      .populate('asignaturaId', 'nombre abreviatura areaId')
      .sort({ asignaturaId: 1 });

    const escalaCualitativa = {
      'S': 'Siempre lo demuestra',
      'C': 'Casi siempre lo demuestra',
      'A': 'A veces lo demuestra',
      'N': 'Nunca lo demuestra'
    };

    const resultado = calificaciones.map(cal => {
      // RN-BOL-07: Convertir nota numérica a escala cualitativa
      const nota = cal.nota || 0;
      let nivelCualitativo;
      if (nota >= 4.5) nivelCualitativo = 'S';
      else if (nota >= 3.5) nivelCualitativo = 'C';
      else if (nota >= 2.0) nivelCualitativo = 'A';
      else nivelCualitativo = 'N';

      return {
        asignatura: cal.asignaturaId,
        periodo: cal.periodo,
        notaOriginal: cal.nota,
        nivelCualitativo,
        descripcion: escalaCualitativa[nivelCualitativo],
        observacion: cal.observacion
      };
    });

    resultado.sort((a, b) => {
      const nombreA = a.asignatura?.nombre || '';
      const nombreB = b.asignatura?.nombre || '';
      return nombreA.localeCompare(nombreB);
    });

    return {
      tipo: 'preescolar',
      estudianteId,
      anioAcademicoId,
      periodo,
      asignaturas: resultado,
      escalaCualitativa,
      totalAsignaturas: resultado.length
    };
  }
}

module.exports = ReporteService;
