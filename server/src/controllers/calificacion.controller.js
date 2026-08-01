const Calificacion = require('../models/Calificacion');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.grupoId) filter.grupoId = req.query.grupoId;
    if (req.query.asignaturaId) filter.asignaturaId = req.query.asignaturaId;
    if (req.query.periodo) filter.periodo = req.query.periodo;
    if (req.query.estudianteId) filter.estudianteId = req.query.estudianteId;
    if (req.usuario.tipoPerfil === 'estudiante') filter.estudianteId = req.usuario._id;

    const data = await Calificacion.find(filter)
      .populate('estudianteId', 'nombres apellidos documento')
      .populate('asignaturaId', 'nombre abreviatura')
      .populate('grupoId', 'nombre grado')
      .sort({ asignaturaId: 1, periodo: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Calificacion.findById(req.params.id)
      .populate('estudianteId', 'nombres apellidos documento')
      .populate('asignaturaId', 'nombre abreviatura')
      .populate('grupoId', 'nombre grado')
      .populate('docenteId', 'nombres apellidos')
      .populate('indicadores.indicadorId', 'codigo descripcion')
      .populate('actividades.actividadId', 'titulo tipo');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, institucionId: req.usuario.institucionId };
    if (!body.docenteId && req.usuario.tipoPerfil === 'docente') body.docenteId = req.usuario._id;
    const data = await Calificacion.create(body);
    res.status(201).json({ ok: true, data, message: 'Calificacion creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Calificacion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Calificacion.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const guardarNotas = async (req, res) => {
  try {
    const { grupoId, asignaturaId, periodo, calificaciones } = req.body;
    const anioAcademicoId = req.body.anioAcademicoId;

    if (!grupoId || !asignaturaId || !periodo || !Array.isArray(calificaciones)) {
      return res.status(400).json({
        ok: false,
        message: 'Se requieren grupoId, asignaturaId, periodo y un array de calificaciones'
      });
    }

    const institucionId = req.usuario.institucionId;
    const actualizadas = [];
    const errores = [];

    for (const item of calificaciones) {
      const { estudianteId, nota, recuperacion, habilitacion } = item;

      if (!estudianteId) {
        errores.push({ item, error: 'Falta estudianteId' });
        continue;
      }
      const valores = { nota, recuperacion, habilitacion };
      for (const [campo, valor] of Object.entries(valores)) {
        if (valor !== undefined && (valor < 0 || valor > 5)) {
          errores.push({ estudianteId, campo, error: `La nota debe estar entre 0 y 5` });
          continue;
        }
      }

      const query = {
        institucionId,
        anioAcademicoId,
        estudianteId,
        asignaturaId,
        grupoId,
        periodo: parseInt(periodo, 10)
      };
      const update = { ...item, institucionId };
      if (anioAcademicoId) update.anioAcademicoId = anioAcademicoId;
      if (req.usuario.tipoPerfil === 'docente') update.docenteId = req.usuario._id;

      const registro = await Calificacion.findOneAndUpdate(
        query,
        { $set: update },
        { new: true, upsert: true, runValidators: true }
      );
      actualizadas.push(registro);
    }

    res.json({
      ok: true,
      data: { actualizadas: actualizadas.length, errores },
      message: `${actualizadas.length} calificaciones guardadas, ${errores.length} con errores`
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al guardar notas', error: error.message });
  }
};

const getByGrupoAsignaturaPeriodo = async (req, res) => {
  try {
    const { grupoId, asignaturaId, periodo } = req.params;
    const filter = {
      institucionId: req.usuario.institucionId,
      grupoId,
      asignaturaId,
      periodo: parseInt(periodo, 10)
    };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;

    const data = await Calificacion.find(filter)
      .populate('estudianteId', 'nombres apellidos documento')
      .populate('asignaturaId', 'nombre abreviatura')
      .sort({ 'estudianteId.apellidos': 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getBoletin = async (req, res) => {
  try {
    const { estudianteId, anioAcademicoId } = req.params;
    const filter = {
      institucionId: req.usuario.institucionId,
      estudianteId,
      anioAcademicoId
    };

    if (req.usuario.tipoPerfil === 'estudiante') filter.estudianteId = req.usuario._id;

    const data = await Calificacion.find(filter)
      .populate('asignaturaId', 'nombre abreviatura areaId')
      .populate('grupoId', 'nombre grado')
      .sort({ asignaturaId: 1, periodo: 1 });

    const agrupado = {};
    for (const cal of data) {
      const clave = cal.asignaturaId ? cal.asignaturaId._id.toString() : cal.asignaturaId;
      if (!agrupado[clave]) {
        agrupado[clave] = {
          asignatura: cal.asignaturaId,
          periodos: [],
          notaDefinitiva: null
        };
      }
      agrupado[clave].periodos.push({
        periodo: cal.periodo,
        nota: cal.nota,
        recuperacion: cal.recuperacion,
        habilitacion: cal.habilitacion,
        estado: cal.estado
      });
    }

    const resultado = Object.values(agrupado).map(materia => {
      const notas = materia.periodos
        .map(p => {
          if (p.habilitacion != null) return p.habilitacion;
          if (p.recuperacion != null) return p.recuperacion;
          return p.nota;
        })
        .filter(n => n != null);
      if (notas.length) {
        materia.notaDefinitiva = notas.reduce((a, b) => a + b, 0) / notas.length;
      }
      return materia;
    });

    res.json({ ok: true, data: resultado, message: 'Boletin obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener boletin', error: error.message });
  }
};

module.exports = {
  getAll, getById, create, update, remove,
  guardarNotas, getByGrupoAsignaturaPeriodo, getBoletin
};
