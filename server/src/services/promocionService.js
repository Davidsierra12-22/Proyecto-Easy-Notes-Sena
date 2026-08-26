const Calificacion = require('../models/Calificacion');
const Matricula = require('../models/Matricula');
const AnioAcademico = require('../models/AnioAcademico');
const Grupo = require('../models/Grupo');
const CalificacionService = require('./calificacionService');

/**
 * Servicio de promoción y retención
 * Reglas de negocio: RN-PRO-01 a RN-PRO-06
 */
class PromocionService {

  /**
   * RN-PRO-01 y RN-PRO-02: Evaluar si el estudiante promueve o reprueba
   * @param {Object} params - { estudianteId, grupoId, anioAcademicoId, institucionId }
   * @returns {Object} - { promovido, areasPerdidas, umbral, detalle }
   */
  static async evaluarPromocion({ estudianteId, grupoId, anioAcademicoId, institucionId }) {
    const anio = await AnioAcademico.findById(anioAcademicoId);
    if (!anio) {
      throw new Error('Año académico no encontrado');
    }

    // RN-PRO-02: Obtener umbral de áreas perdidas (configurable)
    const umbral = anio.configuracion?.numPerdidas || 3;

    // Obtener todas las calificaciones del estudiante en el año
    const calificaciones = await Calificacion.find({
      estudianteId,
      grupoId,
      anioAcademicoId,
      institucionId
    });

    // Agrupar por asignatura y calcular acumulado
    const porAsignatura = {};
    for (const cal of calificaciones) {
      const key = cal.asignaturaId.toString();
      if (!porAsignatura[key]) {
        porAsignatura[key] = [];
      }
      // RN-ACU-03: Usar nota vigente (recuperación/habilitación si existe)
      const notaVigente = cal.recuperacion || cal.habilitacion || cal.nota;
      if (notaVigente != null) {
        porAsignatura[key].push(notaVigente);
      }
    }

    // Calcular promedio por asignatura
    const promedios = {};
    for (const [asignaturaId, notas] of Object.entries(porAsignatura)) {
      if (notas.length > 0) {
        const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
        promedios[asignaturaId] = Math.round(promedio * 10) / 10;
      }
    }

    // RN-PRO-01 y RN-PRO-02: Contar áreas perdidas (promedio < notaMínima)
    const notaMinima = anio.configuracion?.notaMinima || 3.0;
    let areasPerdidas = 0;
    const detalle = [];

    for (const [asignaturaId, promedio] of Object.entries(promedios)) {
      const aprobada = promedio >= notaMinima;
      if (!aprobada) {
        areasPerdidas++;
      }
      detalle.push({
        asignaturaId,
        promedio,
        aprobada,
        notaMinima
      });
    }

    // RN-PRO-02: Reprueba si pierde 3 o más áreas
    const promovido = areasPerdidas < umbral;

    return {
      promovido,
      areasPerdidas,
      umbral,
      notaMinima,
      totalAsignaturas: Object.keys(promedios).length,
      detalle
    };
  }

  /**
   * RN-PRO-04: Asignar estudiante a grupo del mismo grado (repitente)
   * @param {Object} params - { estudianteId, grupoActualId, anioAcademicoId, institucionId }
   * @returns {Object} - { nuevaMatricula }
   */
  static async asignarGrupoRepitente({ estudianteId, grupoActualId, anioAcademicoId, institucionId }) {
    const grupoActual = await Grupo.findById(grupoActualId);
    if (!grupoActual) {
      throw new Error('Grupo actual no encontrado');
    }

    // Buscar un grupo del mismo grado en el mismo año
    const grupoNuevo = await Grupo.findOne({
      institucionId,
      anioAcademicoId,
      grado: grupoActual.grado,
      _id: { $ne: grupoActualId }
    });

    if (!grupoNuevo) {
      throw new Error(`No hay grupo disponible del grado ${grupoActual.grado}`);
    }

    // Actualizar matrícula al nuevo grupo
    const matricula = await Matricula.findOne({
      estudianteId,
      anioAcademicoId,
      institucionId
    });

    if (matricula) {
      matricula.grupoId = grupoNuevo._id;
      matricula.tipoMatricula = 'renovacion';
      matricula.observaciones = `Repite grado ${grupoActual.grado} - Asignado a grupo ${grupoNuevo.nombre}`;
      await matricula.save();
    }

    return {
      nuevaMatricula: matricula,
      grupoAnterior: grupoActual.nombre,
      grupoNuevo: grupoNuevo.nombre
    };
  }

  /**
   * RN-PRO-06: Promover estudiante al grado siguiente
   * @param {Object} params - { estudianteId, grupoActualId, anioAcademicoId, institucionId }
   * @returns {Object} - { nuevaMatricula }
   */
  static async promoverEstudiante({ estudianteId, grupoActualId, anioAcademicoId, institucionId }) {
    const grupoActual = await Grupo.findById(grupoActualId);
    if (!grupoActual) {
      throw new Error('Grupo actual no encontrado');
    }

    const siguienteGrado = grupoActual.grado + 1;

    // Buscar grupo del siguiente grado
    const grupoNuevo = await Grupo.findOne({
      institucionId,
      anioAcademicoId,
      grado: siguienteGrado
    });

    if (!grupoNuevo) {
      throw new Error(`No hay grupo disponible del grado ${siguienteGrado}`);
    }

    // Actualizar matrícula
    const matricula = await Matricula.findOne({
      estudianteId,
      anioAcademicoId,
      institucionId
    });

    if (matricula) {
      matricula.grupoId = grupoNuevo._id;
      matricula.tipoMatricula = 'promovido';
      matricula.promovido = true;
      matricula.observaciones = `Promovido de grado ${grupoActual.grado} a grado ${siguienteGrado}`;
      await matricula.save();
    }

    return {
      nuevaMatricula: matricula,
      grupoAnterior: grupoActual.nombre,
      grupoNuevo: grupoNuevo.nombre,
      gradoAnterior: grupoActual.grado,
      gradoNuevo: siguienteGrado
    };
  }

  /**
   * RN-PRO-05: Cierre masivo de año - copiar datos al nuevo año
   * @param {Object} params - { anioOrigenId, anioDestinoId, institucionId }
   * @returns {Object} - { estudiantesCopiados, matriculasCreadas }
   */
  static async cerrarAnio({ anioOrigenId, anioDestinoId, institucionId }) {
    // Obtener todas las matrículas activas del año origen
    const matriculasOrigen = await Matricula.find({
      anioAcademicoId: anioOrigenId,
      institucionId,
      estado: 'activa'
    }).populate('estudianteId grupoId');

    let estudiantesCopiados = 0;
    let matriculasCreadas = 0;

    for (const matricula of matriculasOrigen) {
      // RN-PRO-05: Copiar datos básicos del estudiante
      const estudiante = matricula.estudianteId;

      // Buscar grupo del siguiente grado en el año destino
      const gradoActual = matricula.grupoId?.grado || 1;
      const siguienteGrado = gradoActual + 1;

      const grupoDestino = await Grupo.findOne({
        institucionId,
        anioAcademicoId: anioDestinoId,
        grado: siguienteGrado
      });

      if (!grupoDestino) {
        continue; // Saltar si no hay grupo disponible
      }

      // Crear nueva matrícula en el año destino
      const nuevaMatricula = await Matricula.findOneAndUpdate(
        {
          estudianteId: estudiante._id,
          anioAcademicoId: anioDestinoId,
          institucionId
        },
        {
          $setOnInsert: {
            estudianteId: estudiante._id,
            anioAcademicoId: anioDestinoId,
            institucionId,
            grupoId: grupoDestino._id,
            tipoMatricula: 'renovacion',
            estado: 'activa'
          }
        },
        { upsert: true, new: true }
      );

      if (nuevaMatricula) {
        matriculasCreadas++;
        estudiantesCopiados++;
      }
    }

    return {
      estudiantesCopiados,
      matriculasCreadas
    };
  }
}

module.exports = PromocionService;
