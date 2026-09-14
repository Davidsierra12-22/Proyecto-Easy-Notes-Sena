const Sede = require('../models/Sede');
const { paginarQuery } = require('../utils/paginacion');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;
    if (req.query.institucionId) filter.institucionId = req.query.institucionId;
    if (req.query.estado) filter.estado = req.query.estado;

    const pg = paginarQuery(req);
    let query = Sede.find(filter)
      .populate('institucionId', 'nombre nit')
      .sort({ nombre: 1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Sede.countDocuments(filter)
      ]);
      return res.json({ ok: true, data, message: 'Listado obtenido', paginacion: { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) } });
    }

    const data = await query;
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Sede.findById(req.params.id).populate('institucionId', 'nombre nit');
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
    const data = await Sede.create(body);
    res.status(201).json({ ok: true, data, message: 'Sede creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Sede.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Sede.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
