const Bitacora = require('../models/Bitacora');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;
    if (req.query.accion) filter.accion = req.query.accion;
    if (req.query.usuarioId) filter.usuarioId = req.query.usuarioId;

    const data = await Bitacora.find(filter)
      .populate('usuarioId', 'nombres apellidos documento')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit, 10) || 100);
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Bitacora.findById(req.params.id).populate('usuarioId', 'nombres apellidos documento');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const getByUsuario = async (req, res) => {
  try {
    const filter = { usuarioId: req.params.usuarioId };
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;

    const data = await Bitacora.find(filter)
      .populate('usuarioId', 'nombres apellidos documento')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit, 10) || 100);
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

module.exports = { getAll, getById, getByUsuario };
