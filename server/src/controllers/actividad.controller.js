const Actividad = require('../models/Actividad');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.grupoId) filter.grupoId = req.query.grupoId;
    if (req.query.asignaturaId) filter.asignaturaId = req.query.asignaturaId;
    if (req.query.indicadorId) filter.indicadorId = req.query.indicadorId;
    if (req.query.periodo) filter.periodo = req.query.periodo;
    filter.estado = req.query.estado || 'activo';

    const data = await Actividad.find(filter)
      .populate('indicadorId', 'codigo descripcion')
      .populate('asignaturaId', 'nombre abreviatura')
      .populate('grupoId', 'nombre grado')
      .sort({ periodo: 1, createdAt: -1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Actividad.findById(req.params.id)
      .populate('indicadorId', 'codigo descripcion')
      .populate('asignaturaId', 'nombre abreviatura')
      .populate('grupoId', 'nombre grado')
      .populate('docenteId', 'nombres apellidos');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, institucionId: req.usuario.institucionId };
    if (!body.docenteId) body.docenteId = req.usuario._id;
    const data = await Actividad.create(body);
    res.status(201).json({ ok: true, data, message: 'Actividad creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Actividad.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Actividad.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const getByGrupoPeriodo = async (req, res) => {
  try {
    const filter = {
      institucionId: req.usuario.institucionId,
      grupoId: req.params.grupoId,
      periodo: parseInt(req.params.periodo, 10),
      estado: 'activo'
    };
    if (req.query.asignaturaId) filter.asignaturaId = req.query.asignaturaId;

    const data = await Actividad.find(filter)
      .populate('indicadorId', 'codigo descripcion')
      .populate('asignaturaId', 'nombre abreviatura')
      .sort({ asignaturaId: 1, createdAt: -1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getByGrupoPeriodo };
