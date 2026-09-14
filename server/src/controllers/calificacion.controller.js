const Calificacion = require('../models/Calificacion');
const CalificacionService = require('../services/calificacionService');
const Grupo = require('../models/Grupo');
const Institucion = require('../models/Institucion');
const { paginarQuery } = require('../utils/paginacion');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.grupoId) filter.grupoId = req.query.grupoId;
    if (req.query.sedeId) {
      const gruposSede = await Grupo.find({ institucionId: req.usuario.institucionId, sedeId: req.query.sedeId }).select('_id');
      filter.grupoId = { $in: gruposSede.map(g => g._id) };
    }
    if (req.query.asignaturaId) filter.asignaturaId = req.query.asignaturaId;
    if (req.query.periodo) filter.periodo = req.query.periodo;
    if (req.query.estudianteId) filter.estudianteId = req.query.estudianteId;
    if (req.usuario.tipoPerfil === 'estudiante') filter.estudianteId = req.usuario._id;

    const pg = paginarQuery(req);
    const query = Calificacion.find(filter)
      .populate('estudianteId', 'nombres apellidos documento')
      .populate('asignaturaId', 'nombre abreviatura')
      .populate('grupoId', 'nombre grado')
      .sort({ asignaturaId: 1, periodo: 1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Calificacion.countDocuments(filter)
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

    // Recalcular nota final para cada estudiante usando el service
    for (const reg of actualizadas) {
      try {
        await CalificacionService.calcularNotaPeriodo({
          estudianteId: reg.estudianteId,
          asignaturaId,
          grupoId,
          anioAcademicoId,
          periodo: parseInt(periodo, 10),
          institucionId
        });
      } catch (e) {
        // Si falla el cálculo, la nota se queda con el valor manual
      }
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

const calcularRecuperacion = async (req, res) => {
  try {
    const { calificacionId, notaRecuperacion } = req.body;
    if (!calificacionId || notaRecuperacion == null) {
      return res.status(400).json({ ok: false, message: 'calificacionId y notaRecuperacion son requeridos' });
    }
    const resultado = await CalificacionService.aplicarRecuperacion({
      calificacionId,
      notaRecuperacion,
      institucionId: req.usuario.institucionId
    });
    res.json({ ok: true, data: resultado, message: 'Recuperación aplicada' });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

const calcularHabilitacion = async (req, res) => {
  try {
    const { calificacionId, notaHabilitacion } = req.body;
    if (!calificacionId || notaHabilitacion == null) {
      return res.status(400).json({ ok: false, message: 'calificacionId y notaHabilitacion son requeridos' });
    }
    const resultado = await CalificacionService.aplicarHabilitacion({
      calificacionId,
      notaHabilitacion,
      institucionId: req.usuario.institucionId
    });
    res.json({ ok: true, data: resultado, message: 'Habilitación aplicada' });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
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

    const nivelesEscala = await Institucion.findById(req.usuario.institucionId)
      .select('configuracion.niveles')
      .lean()
      .then(i => i?.configuracion?.niveles || null)
      .catch(() => null);

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
          notaDefinitiva: null,
          logro: null
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
        const definitiva = notas.reduce((a, b) => a + b, 0) / notas.length;
        materia.notaDefinitiva = Math.round(definitiva * 10) / 10;
        materia.logro = CalificacionService.generarLogro(materia.notaDefinitiva, nivelesEscala);
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
  guardarNotas, calcularRecuperacion, calcularHabilitacion,
  getByGrupoAsignaturaPeriodo, getBoletin
};
