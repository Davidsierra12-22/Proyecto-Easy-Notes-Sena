const Institucion = require('../models/Institucion');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.tipo) filter.tipo = req.query.tipo;

    const data = await Institucion.find(filter)
      .populate('nucleoId', 'nombre municipio')
      .populate('rectorId', 'nombres apellidos documento')
      .populate('secretariaId', 'nombres apellidos documento')
      .sort({ nombre: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Institucion.findById(req.params.id)
      .populate('nucleoId', 'nombre municipio departamento')
      .populate('rectorId', 'nombres apellidos documento')
      .populate('secretariaId', 'nombres apellidos documento');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = await Institucion.create(req.body);
    res.status(201).json({ ok: true, data, message: 'Institucion creada correctamente' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe una institucion con ese NIT', error: error.message });
    }
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Institucion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Institucion.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const getConfiguracion = async (req, res) => {
  try {
    const data = await Institucion.findById(req.params.id).select('configuracion nombre');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data: data.configuracion, message: 'Configuracion obtenida' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener configuracion', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getConfiguracion };
