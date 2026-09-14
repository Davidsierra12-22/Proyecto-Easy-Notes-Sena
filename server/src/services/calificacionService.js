const Calificacion = require('../models/Calificacion');
const Indicador = require('../models/Indicador');
const Actividad = require('../models/Actividad');
const AnioAcademico = require('../models/AnioAcademico');

/**
 * Servicio de cálculo de calificaciones
 * Reglas de negocio: RN-CAL-01 a RN-CAL-05, RN-REC, RN-HAB, RN-ACU
 */
class CalificacionService {

  /**
   * RN-CAL-01: Método general de cálculo
   * Promedio = promedio(actividades) por indicador, luego promedio(indicadores) con pesos
   * @param {Object} params - { estudianteId, asignaturaId, grupoId, anioAcademicoId, periodo, institucionId }
   * @returns {Object} - { notaFinal, indicadores calculados }
   */
  static async calcularNotaPeriodo({ estudianteId, asignaturaId, grupoId, anioAcademicoId, periodo, institucionId }) {
    // 1. Obtener indicadores de la asignatura en ese período
    const indicadores = await Indicador.find({
      asignaturaId,
      anioAcademicoId,
      periodo,
      estado: 'activo'
    }).sort({ orden: 1 });

    if (!indicadores.length) {
      return { notaFinal: 0, indicadores: [] };
    }

    // 2. Obtener calificación del estudiante
    const calificacion = await Calificacion.findOne({
      estudianteId,
      asignaturaId,
      grupoId,
      anioAcademicoId,
      periodo
    });

    if (!calificacion) {
      return { notaFinal: 0, indicadores: [] };
    }

    // 3. Calcular nota por indicador (RN-CAL-03: promedio aritmético de actividades)
    const indicadoresCalculados = [];
    let sumaPonderada = 0;
    let sumaPesos = 0;

    for (const indicador of indicadores) {
      // Buscar actividades del estudiante para este indicador
      const actividadesEnCalificacion = calificacion.actividades || [];
      const indicadorEnCalificacion = calificacion.indicadores.find(
        ind => ind.indicadorId.toString() === indicador._id.toString()
      );

      let notaIndicador = 0;

      if (indicadorEnCalificacion && indicadorEnCalificacion.nota != null) {
        // Si ya tiene nota calculada, usarla
        notaIndicador = indicadorEnCalificacion.nota;
      } else if (actividadesEnCalificacion.length > 0) {
        // Calcular promedio de actividades para este indicador
        // Filtrar actividades que pertenecen a este indicador
        const actividadesDelIndicador = await Actividad.find({
          indicadorId: indicador._id,
          asignaturaId,
          grupoId,
          periodo,
          estado: 'activo'
        });

        const actividadIds = actividadesDelIndicador.map(a => a._id.toString());
        const notasActividades = actividadesEnCalificacion
          .filter(act => actividadIds.includes(act.actividadId.toString()))
          .map(act => act.nota)
          .filter(n => n != null);

        if (notasActividades.length > 0) {
          // RN-CAL-03: Promedio aritmético simple
          notaIndicador = notasActividades.reduce((a, b) => a + b, 0) / notasActividades.length;
        }
      }

      // RN-CAL-04: Redondeo a 1 decimal
      notaIndicador = Math.round(notaIndicador * 10) / 10;

      const peso = indicador.peso || 0;
      indicadoresCalculados.push({
        indicadorId: indicador._id,
        descripcion: indicador.descripcion,
        nota: notaIndicador,
        peso
      });

      sumaPonderada += notaIndicador * peso;
      sumaPesos += peso;
    }

    // RN-CAL-01: Nota final = promedio ponderado de indicadores
    let notaFinal = sumaPesos > 0 ? sumaPonderada / sumaPesos : 0;

    // RN-CAL-04: Redondeo a 1 decimal
    notaFinal = Math.round(notaFinal * 10) / 10;

    // Actualizar calificación en BD
    calificacion.nota = notaFinal;
    calificacion.indicadores = indicadoresCalculados;
    await calificacion.save();

    return {
      notaFinal,
      indicadores: indicadoresCalculados
    };
  }

  /**
   * RN-REC-01 a RN-REC-03: Proceso de recuperación
   * @param {Object} params - { calificacionId, notaRecuperacion, institucionId }
   * @returns {Object} - { notaFinal, recuperacion, estado }
   */
  static async aplicarRecuperacion({ calificacionId, notaRecuperacion, institucionId }) {
    const calificacion = await Calificacion.findOne({ _id: calificacionId, institucionId });
    if (!calificacion) {
      throw new Error('Calificación no encontrada');
    }

    // RN-REC-01: Solo aplica si reprobó (nota < 3.0)
    if (calificacion.nota >= 3.0) {
      throw new Error('La recuperación solo aplica para estudiantes reprobados (nota < 3.0)');
    }

    // RN-REC-03: Nota máxima de recuperación es 3.0
    const notaFinal = Math.min(notaRecuperacion, 3.0);

    // RN-REC-02: La recuperación reemplaza la nota si es superior
    if (notaFinal > calificacion.nota) {
      calificacion.recuperacion = notaFinal;
      calificacion.nota = notaFinal;
      calificacion.estado = 'recuperado';
      await calificacion.save();
    }

    return {
      notaFinal: calificacion.nota,
      recuperacion: calificacion.recuperacion,
      estado: calificacion.estado
    };
  }

  /**
   * RN-HAB-01 a RN-HAB-04: Proceso de habilitación (solo al final del año)
   * @param {Object} params - { calificacionId, notaHabilitacion, institucionId }
   * @returns {Object} - { notaFinal, habilitacion, estado }
   */
  static async aplicarHabilitacion({ calificacionId, notaHabilitacion, institucionId }) {
    const calificacion = await Calificacion.findOne({ _id: calificacionId, institucionId });
    if (!calificacion) {
      throw new Error('Calificación no encontrada');
    }

    // RN-HAB-01: Solo aplica para notas entre 2.0 y 2.9
    if (calificacion.nota < 2.0 || calificacion.nota >= 3.0) {
      throw new Error('La habilitación solo aplica para notas entre 2.0 y 2.9');
    }

    // RN-HAB-03: Nota máxima de habilitación es 3.0
    const notaFinal = Math.min(notaHabilitacion, 3.0);

    // RN-HAB-02: Reemplaza la nota si es aprobatoria (>= 3.0)
    if (notaFinal >= 3.0) {
      calificacion.habilitacion = notaFinal;
      calificacion.nota = notaFinal;
      calificacion.estado = 'habilitado';
      await calificacion.save();
    }

    return {
      notaFinal: calificacion.nota,
      habilitacion: calificacion.habilitacion,
      estado: calificacion.estado
    };
  }

  /**
   * RN-ACU-01 a RN-ACU-03: Calcular acumulado anual
   * @param {Object} params - { estudianteId, asignaturaId, grupoId, anioAcademicoId, institucionId }
   * @returns {Object} - { promedioAcumulado, periodos: [...] }
   */
  static async calcularAcumulado({ estudianteId, asignaturaId, grupoId, anioAcademicoId, institucionId }) {
    const anio = await AnioAcademico.findById(anioAcademicoId);
    if (!anio) {
      throw new Error('Año académico no encontrado');
    }

    const numPeriodos = anio.configuracion?.numeroPeriodos || 4;

    // Obtener todas las calificaciones del estudiante en esta asignatura
    const calificaciones = await Calificacion.find({
      estudianteId,
      asignaturaId,
      grupoId,
      anioAcademicoId,
      institucionId
    }).sort({ periodo: 1 });

    // RN-ACU-02: Calcular promedio de periodos cerrados
    const periodosCerrados = calificaciones.filter(c => c.estado === 'cerrado' || c.estado === 'recuperado' || c.estado === 'habilitado');

    let sumaNotas = 0;
    let periodosConNota = 0;

    for (const cal of periodosCerrados) {
      // RN-ACU-03: Usar la nota más reciente (recuperación/habilitación si existe)
      const notaVigente = cal.recuperacion || cal.habilitacion || cal.nota;
      if (notaVigente != null) {
        sumaNotas += notaVigente;
        periodosConNota++;
      }
    }

    // RN-ACU-01: Promedio entre todos los periodos configurados
    const promedioAcumulado = periodosConNota > 0
      ? Math.round((sumaNotas / numPeriodos) * 10) / 10
      : 0;

    return {
      promedioAcumulado,
      periodos: calificaciones.map(c => ({
        periodo: c.periodo,
        nota: c.nota,
        recuperacion: c.recuperacion,
        habilitacion: c.habilitacion,
        notaVigente: c.recuperacion || c.habilitacion || c.nota,
        estado: c.estado
      }))
    };
  }

  /**
   * RN-BOL-06: Generar logro cualitativo según nota
   * @param {Number} nota
   * @param {Array} niveles - [{orden, valor, rangoMin, rangoMax}] desde configuracion.niveles
   * @returns {String} - Nombre del nivel de desempeño
   */
  static generarLogro(nota, niveles) {
    const escala = Array.isArray(niveles) && niveles.length
      ? niveles
      : [
        { orden: 1, valor: 'Desempeño Superior', rangoMin: 4.6, rangoMax: 5.0 },
        { orden: 2, valor: 'Desempeño Alto', rangoMin: 4.0, rangoMax: 4.5 },
        { orden: 3, valor: 'Desempeño Básico', rangoMin: 3.0, rangoMax: 3.9 },
        { orden: 4, valor: 'Desempeño Bajo', rangoMin: 1.0, rangoMax: 2.9 }
      ]
    const ordenados = escala
      .filter(n => n.rangoMin != null && n.rangoMax != null && n.valor)
      .sort((a, b) => (b.rangoMin ?? 0) - (a.rangoMin ?? 0))
    const nivel = ordenados.find(n => nota >= n.rangoMin && nota <= n.rangoMax)
    return nivel ? nivel.valor : 'Desempeño sin definir'
  }
}

module.exports = CalificacionService;
