const Matricula = require('../models/Matricula');
const PromocionService = require('../services/promocionService');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.grupoId) filter.grupoId = req.query.grupoId;

    const data = await Matricula.find(filter)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .populate('grupoId', 'nombre grado jornada')
      .sort({ createdAt: -1 });
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

module.exports = { getAll, getById, create, update, remove, retirar, promover, evaluarPromocion, getByGrupo };
