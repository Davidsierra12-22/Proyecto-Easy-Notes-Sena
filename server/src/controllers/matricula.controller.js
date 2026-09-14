const Matricula = require('../models/Matricula');
const PromocionService = require('../services/promocionService');
const Calificacion = require('../models/Calificacion');
const Grupo = require('../models/Grupo');
const Comunicados = require('../models/Comunicados');
const { paginarQuery } = require('../utils/paginacion');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.grupoId) filter.grupoId = req.query.grupoId;
    if (req.query.sedeId) {
      const gruposSede = await Grupo.find({ institucionId: req.usuario.institucionId, sedeId: req.query.sedeId }).select('_id');
      filter.grupoId = { $in: gruposSede.map(g => g._id) };
    }

    const pg = paginarQuery(req);
    const query = Matricula.find(filter)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .populate('grupoId', 'nombre grado jornada')
      .sort({ createdAt: -1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Matricula.countDocuments(filter)
      ]);
      return res.json({
        ok: true,
        data,
        paginacion: { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) },
        message: 'Listado obtenido'
      });
    }

    const data = await query;
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Matricula.findById(req.params.id)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .populate('grupoId', 'nombre grado jornada');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, institucionId: req.usuario.institucionId };
    const data = await Matricula.create(body);
    res.status(201).json({ ok: true, data, message: 'Matricula creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Matricula.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Matricula.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const retirar = async (req, res) => {
  try {
    const data = await Matricula.findById(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'Matricula no encontrada' });
    if (data.estado !== 'activa') {
      return res.status(400).json({ ok: false, message: `La matricula ya esta ${data.estado}` });
    }
    data.estado = 'retirada';
    data.observaciones = req.body.observaciones || data.observaciones;
    await data.save();
    res.json({ ok: true, data, message: 'Matricula retirada' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al retirar', error: error.message });
  }
};

const promover = async (req, res) => {
  try {
    const matricula = await Matricula.findById(req.params.id);
    if (!matricula) return res.status(404).json({ ok: false, message: 'Matricula no encontrada' });

    const { promovido, observaciones } = req.body;

    // Evaluar promoción usando el service si se solicita
    if (promovido === true) {
      try {
        const evaluacion = await PromocionService.evaluarPromocion({
          estudianteId: matricula.estudianteId,
          grupoId: matricula.grupoId,
          anioAcademicoId: matricula.anioAcademicoId,
          institucionId: matricula.institucionId
        });

        if (!evaluacion.promovido) {
          return res.status(400).json({
            ok: false,
            message: `El estudiante no cumple los requisitos de promoción. Áreas perdidas: ${evaluacion.areasPerdidas}/${evaluacion.umbral}`,
            data: evaluacion
          });
        }

        const resultado = await PromocionService.promoverEstudiante({
          estudianteId: matricula.estudianteId,
          grupoActualId: matricula.grupoId,
          anioAcademicoId: matricula.anioAcademicoId,
          institucionId: matricula.institucionId
        });

        return res.json({
          ok: true,
          data: resultado,
          message: 'Estudiante promovido correctamente'
        });
      } catch (e) {
        // Si falla el service (ej: no hay grupo disponible), usar lógica simple
        matricula.estado = 'graduado';
        matricula.promovido = true;
        matricula.observaciones = observaciones || matricula.observaciones;
        await matricula.save();
        return res.json({ ok: true, data: matricula, message: 'Estudiante promovido' });
      }
    } else {
      // Repitente: asignar al mismo grado
      try {
        const resultado = await PromocionService.asignarGrupoRepitente({
          estudianteId: matricula.estudianteId,
          grupoActualId: matricula.grupoId,
          anioAcademicoId: matricula.anioAcademicoId,
          institucionId: matricula.institucionId
        });

        matricula.promovido = false;
        matricula.observaciones = observaciones || `Repite grado - Asignado a grupo ${resultado.grupoNuevo}`;
        await matricula.save();

        return res.json({
          ok: true,
          data: { matricula, ...resultado },
          message: 'Estudiante no promovido - repite grado'
        });
      } catch (e) {
        matricula.promovido = false;
        matricula.observaciones = observaciones || matricula.observaciones;
        await matricula.save();
        return res.json({ ok: true, data: matricula, message: 'Estudiante no promovido' });
      }
    }
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al promover', error: error.message });
  }
};

const evaluarPromocion = async (req, res) => {
  try {
    const { estudianteId, anioAcademicoId } = req.body;
    if (!estudianteId || !anioAcademicoId) {
      return res.status(400).json({ ok: false, message: 'estudianteId y anioAcademicoId son requeridos' });
    }

    // Buscar la matrícula activa del estudiante
    const matricula = await Matricula.findOne({
      estudianteId,
      anioAcademicoId,
      institucionId: req.usuario.institucionId,
      estado: 'activa'
    });

    if (!matricula) {
      return res.status(404).json({ ok: false, message: 'No se encontró matrícula activa' });
    }

    const evaluacion = await PromocionService.evaluarPromocion({
      estudianteId,
      grupoId: matricula.grupoId,
      anioAcademicoId,
      institucionId: req.usuario.institucionId
    });

    res.json({ ok: true, data: evaluacion, message: 'Evaluación de promoción' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al evaluar promoción', error: error.message });
  }
};

const getByGrupo = async (req, res) => {
  try {
    const filter = {
      institucionId: req.usuario.institucionId,
      grupoId: req.params.grupoId,
      estado: 'activa'
    };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;

    const data = await Matricula.find(filter)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .sort({ 'estudianteId.apellidos': 1 });
    res.json({ ok: true, data, message: 'Listado del grupo obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar grupo', error: error.message });
  }
};

// MT-002: Cambio de grupo (individual o masivo). Mantiene notas y notifica al nuevo director de grupo
const cambioGrupo = async (req, res) => {
  try {
    const { ids, grupoId, fechaCambio, observaciones } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ ok: false, message: 'Debes indicar al menos una matrícula' });
    }
    if (!grupoId) {
      return res.status(400).json({ ok: false, message: 'Grupo destino es requerido' });
    }

    const grupoDestino = await Grupo.findOne({ _id: grupoId, institucionId: req.usuario.institucionId });
    if (!grupoDestino) {
      return res.status(404).json({ ok: false, message: 'Grupo destino no encontrado' });
    }

    const matriculas = await Matricula.find({
      _id: { $in: ids },
      institucionId: req.usuario.institucionId,
      estado: 'activa'
    }).populate('estudianteId', 'nombres apellidos');

    if (matriculas.length === 0) {
      return res.status(404).json({ ok: false, message: 'Matrículas activas no encontradas' });
    }

    const fecha = fechaCambio ? new Date(fechaCambio) : new Date();
    const movidos = [];

    for (const mat of matriculas) {
      const anterior = mat.grupoId;
      mat.grupoId = grupoDestino._id;
      mat.fechaCambioGrupo = fecha;
      mat.observaciones = observaciones
        ? `${mat.observaciones ? mat.observaciones + ' · ' : ''}Cambio de grupo: ${anterior} -> ${grupoDestino.nombre} (${fecha.toISOString().slice(0, 10)})${observaciones ? ' · ' + observaciones : ''}`
        : `Cambio de grupo: ${anterior} -> ${grupoDestino.nombre} (${fecha.toISOString().slice(0, 10)})`;
      await mat.save();

      // MT-002-2: Las calificaciones del estudiante se mantienen asociadas al nuevo grupo
      await Calificacion.updateMany(
        { estudianteId: mat.estudianteId, anioAcademicoId: mat.anioAcademicoId, institucionId: mat.institucionId },
        { $set: { grupoId: grupoDestino._id } }
      );

      movidos.push({
        matriculaId: mat._id,
        estudiante: mat.estudianteId ? `${mat.estudianteId.nombres} ${mat.estudianteId.apellidos}` : mat.estudianteId
      });
    }

    // MT-002-3: Notificar al director del nuevo grupo
    let notificacion = null;
    if (grupoDestino.docenteDirectorId) {
      notificacion = await Comunicados.create({
        institucionId: req.usuario.institucionId,
        remitenteId: req.usuario._id,
        destinatarios: [{ usuarioId: grupoDestino.docenteDirectorId, rol: 'docente' }],
        asunto: 'Cambio de grupo',
        mensaje: `Se le notifica el ingreso de ${movidos.length} estudiante(s) al grupo ${grupoDestino.nombre}: ${movidos.map(m => m.estudiante).join(', ')}.`,
        prioridad: 'normal'
      });
    }

    res.json({
      ok: true,
      data: { movidos, grupoDestino: grupoDestino.nombre, notificados: Boolean(notificacion) },
      message: `${movidos.length} matrícula(s) cambiada(s) al grupo ${grupoDestino.nombre}`
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al cambiar de grupo', error: error.message });
  }
};

// PY-002: Ejecutar cierre de año académico (migrar datos al nuevo año)
const cerrarAnio = async (req, res) => {
  try {
    const { anioOrigenId, anioDestinoId } = req.body;
    if (!anioOrigenId || !anioDestinoId) {
      return res.status(400).json({ ok: false, message: 'anioOrigenId y anioDestinoId son requeridos' });
    }

    const resultado = await PromocionService.cerrarAnio({
      anioOrigenId,
      anioDestinoId,
      institucionId: req.usuario.institucionId
    });

    res.json({ ok: true, data: resultado, message: 'Cierre de año ejecutado' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al cerrar año', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, retirar, promover, evaluarPromocion, getByGrupo, cambioGrupo, cerrarAnio };
