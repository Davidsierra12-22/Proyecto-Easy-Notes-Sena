const Institucion = require('../models/Institucion');
const Sede = require('../models/Sede');
const { paginarQuery } = require('../utils/paginacion');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter._id = req.usuario.institucionId;
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.tipo) filter.tipo = req.query.tipo;

    const pg = paginarQuery(req, 50);
    let query = Institucion.find(filter)
      .populate('nucleoId', 'nombre municipio')
      .populate('rectorId', 'nombres apellidos documento')
      .populate('secretariaId', 'nombres apellidos documento')
      .sort({ nombre: 1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Institucion.countDocuments(filter)
      ]);
      const ids = data.map(i => i._id);
      const conteoSedes = ids.length
        ? await Sede.aggregate([
            { $match: { institucionId: { $in: ids } } },
            { $group: { _id: '$institucionId', count: { $sum: 1 } } }
          ])
        : [];
      const sedesPorInstitucion = {};
      conteoSedes.forEach(s => { sedesPorInstitucion[s._id] = s.count; });
      const resultado = data.map(i => ({
        ...i.toObject(),
        sedesCount: sedesPorInstitucion[i._id] || 0
      }));
      return res.json({
        ok: true,
        data: resultado,
        message: 'Listado obtenido',
        paginacion: { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) }
      });
    }

    const data = await query;
    const conteoSedes = await Sede.aggregate([
      { $match: { institucionId: { $in: data.map(i => i._id) } } },
      { $group: { _id: '$institucionId', count: { $sum: 1 } } }
    ]);
    const sedesPorInstitucion = {};
    conteoSedes.forEach(s => { sedesPorInstitucion[s._id] = s.count; });
    const resultado = data.map(i => ({
      ...i.toObject(),
      sedesCount: sedesPorInstitucion[i._id] || 0
    }));
    res.json({ ok: true, data: resultado, message: 'Listado obtenido' });
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
