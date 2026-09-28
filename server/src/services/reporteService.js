const Calificacion = require('../models/Calificacion');
const Indicador = require('../models/Indicador');
const AnioAcademico = require('../models/AnioAcademico');
const Institucion = require('../models/Institucion');
const Grupo = require('../models/Grupo');
const Matricula = require('../models/Matricula');
const Usuario = require('../models/Usuario');
const CalificacionService = require('./calificacionService');
const PromocionService = require('./promocionService');

/**
 * Servicio de reportes y boletines
 * Reglas de negocio: RN-BOL-01 a RN-BOL-07
 */
class ReporteService {

  /**
   * Obtiene la escala de desempeños (niveles) configurada en la institución
   * @param {String} institucionId
   * @returns {Array|null} niveles [{orden, valor, rangoMin, rangoMax}]
   */
  static async obtenerNiveles(institucionId) {
    if (!institucionId) return null;
    const inst = await Institucion.findById(institucionId).lean();
    return inst?.configuracion?.niveles || null;
  }

  /**
   * RN-BOL-01: Generar boletín acumulativo
   * Muestra notas de todos los periodos cursados y promedio
   */
  static async generarBoletinAcumulativo({ estudianteId, anioAcademicoId, institucionId }) {
    const nivelesEscala = await this.obtenerNiveles(institucionId);
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
        const logro = CalificacionService.generarLogro(notaVigente, nivelesEscala);
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
        logroFinal: CalificacionService.generarLogro(promedioAnual, nivelesEscala),
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
    const nivelesEscala = await this.obtenerNiveles(institucionId);
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
        logro: CalificacionService.generarLogro(notaVigente || 0, nivelesEscala),
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
    const nivelesEscala = await this.obtenerNiveles(institucionId);
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
        logro: CalificacionService.generarLogro(notaVigente || 0, nivelesEscala),
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
/**
   * Cuadro de honor/información: mejores estudiantes por curso según promedio del período
   * @param {Object} params - { anioAcademicoId, institucionId, periodo, topN }
   * @returns {Promise<Array>} [{ gradoNumero, gradoNombre, grupos: [{ grupoNombre, estudiantes: [{ puesto, nombres, apellidos, documento, promedio }] }] }]
   */
  static async generarCuadroHonor({ anioAcademicoId, institucionId, periodo, topN = 3 }) {
    const [institucion, matriculas, calificaciones] = await Promise.all([
      Institucion.findById(institucionId).select('configuracion').lean(),
      Matricula.find({
        institucionId,
        anioAcademicoId,
        estado: 'activa'
      }).select('estudianteId grupoId').populate('grupoId', 'nombre grado').populate('estudianteId', 'nombres apellidos documento').lean(),
      Calificacion.find({
        institucionId,
        anioAcademicoId,
        periodo
      }).select('estudianteId nota recuperacion habilitacion').lean()
    ]);

    // Promedio por estudiante para el período (misma regla que el boletín corto)
    const porEstudiante = {};
    for (const cal of calificaciones) {
      const id = cal.estudianteId?.toString();
      if (!id) continue;
      const notaVigente = cal.recuperacion ?? (cal.habilitacion ?? cal.nota);
      if (notaVigente == null) continue;
      if (!porEstudiante[id]) porEstudiante[id] = { suma: 0, conteo: 0 };
      porEstudiante[id].suma += notaVigente;
      porEstudiante[id].conteo += 1;
    }

    // Agrupar matriculados por grupo con su promedio
    const gruposMap = {};
    for (const m of matriculas) {
      const grupo = m.grupoId;
      const estudiante = m.estudianteId;
      if (!grupo || !estudiante) continue;
      const idEstudiante = estudiante._id.toString();
      const acu = porEstudiante[idEstudiante];
      if (!acu || acu.conteo === 0) continue;

      const clave = grupo._id.toString();
      if (!gruposMap[clave]) {
        gruposMap[clave] = { grupoId: grupo._id, gradoNumero: grupo.grado, grupoNombre: grupo.nombre, estudiantes: [] };
      }

      const nombreGrado = (institucion?.configuracion?.grados || [])
        .find(g => Number(g.numero) === Number(grupo.grado))?.nombre;

      gruposMap[clave].estudiantes.push({
        estudianteId: idEstudiante,
        nombres: estudiante.nombres || '',
        apellidos: estudiante.apellidos || '',
        documento: estudiante.documento || '',
        gradoNombre: nombreGrado || `Grado ${grupo.grado}`,
        promedio: Math.round((acu.suma / acu.conteo) * 100) / 100
      });
    }

    // Ordenar por promedio desc, asignar puesto y recortar al topN
    const grupos = Object.values(gruposMap).map(g => {
      g.estudiantes.sort((a, b) => b.promedio - a.promedio || String(a.apellidos).localeCompare(String(b.apellidos)));
      g.estudiantes = g.estudiantes.slice(0, Math.max(1, Math.min(Number(topN) || 3, 100)))
        .map((e, i) => ({ puesto: i + 1, ...e }));
      return g;
    }).sort((a, b) => a.gradoNumero - b.gradoNumero || String(a.grupoNombre).localeCompare(String(b.grupoNombre)));

    // Agrupar por grado
    const porGrado = {};
    for (const g of grupos) {
      const clave = String(g.gradoNumero);
      if (!porGrado[clave]) {
        porGrado[clave] = {
          gradoNumero: g.gradoNumero,
          gradoNombre: g.estudiantes?.[0]?.gradoNombre || `Grado ${g.gradoNumero}`,
          grupos: []
        };
      }
      porGrado[clave].grupos.push({ grupoNombre: g.grupoNombre, estudiantes: g.estudiantes });
    }

    return Object.keys(porGrado)
      .sort((a, b) => Number(a) - Number(b))
      .map(k => porGrado[k]);
  }
}

module.exports = ReporteService;
