const Catalogo = require('../models/Catalogo');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;
    if (req.query.institucionId) filter.institucionId = req.query.institucionId;
    if (req.query.tipo) filter.tipo = req.query.tipo;
    if (req.query.activo !== undefined) filter.activo = req.query.activo === 'true';

    const data = await Catalogo.find(filter).sort({ tipo: 1, orden: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Catalogo.findById(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.institucionId && req.usuario.institucionId) body.institucionId = req.usuario.institucionId;
    const data = await Catalogo.create(body);
    res.status(201).json({ ok: true, data, message: 'Catalogo creado correctamente' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un item con ese codigo y tipo', error: error.message });
    }
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Catalogo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Catalogo.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const getByTipo = async (req, res) => {
  try {
    const filter = { tipo: req.params.tipo, activo: true };
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;

    const data = await Catalogo.find(filter).sort({ orden: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getByTipo };
