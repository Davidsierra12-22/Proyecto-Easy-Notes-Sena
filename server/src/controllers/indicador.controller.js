const Indicador = require('../models/Indicador');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.asignaturaId) filter.asignaturaId = req.query.asignaturaId;
    if (req.query.periodo) filter.periodo = req.query.periodo;

    const data = await Indicador.find(filter)
      .populate('asignaturaId', 'nombre abreviatura')
      .sort({ periodo: 1, orden: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Indicador.findById(req.params.id).populate('asignaturaId', 'nombre abreviatura');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, institucionId: req.usuario.institucionId };
    const data = await Indicador.create(body);
    res.status(201).json({ ok: true, data, message: 'Indicador creado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Indicador.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Indicador.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const getByAsignaturaPeriodo = async (req, res) => {
  try {
    const filter = {
      institucionId: req.usuario.institucionId,
      asignaturaId: req.params.asignaturaId,
      periodo: parseInt(req.params.periodo, 10)
    };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;

    const data = await Indicador.find(filter).sort({ orden: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getByAsignaturaPeriodo };
