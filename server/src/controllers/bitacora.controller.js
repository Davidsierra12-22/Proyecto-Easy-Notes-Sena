const Bitacora = require('../models/Bitacora');
const { BITACORA } = require('../config/constants');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;
    if (req.query.accion) filter.accion = req.query.accion;
    if (req.query.usuarioId) filter.usuarioId = req.query.usuarioId;
    if (req.query.coleccion) filter.coleccion = req.query.coleccion;

    // Filtro por rango de fechas
    if (req.query.fechaDesde || req.query.fechaHasta) {
      filter.createdAt = {};
      if (req.query.fechaDesde) filter.createdAt.$gte = new Date(req.query.fechaDesde);
      if (req.query.fechaHasta) {
        const hasta = new Date(req.query.fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = hasta;
      }
    }

    // Filtro por texto en detalle
    if (req.query.buscar) {
      filter.detalle = { $regex: req.query.buscar, $options: 'i' };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Bitacora.find(filter)
        .populate('usuarioId', 'nombres apellidos documento')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bitacora.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      data,
      paginacion: { pagina: page, limite: limit, total, totalPaginas: Math.ceil(total / limit) },
      message: 'Listado obtenido'
    });
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
    if (req.query.accion) filter.accion = req.query.accion;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Bitacora.find(filter)
        .populate('usuarioId', 'nombres apellidos documento')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bitacora.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      data,
      paginacion: { pagina: page, limite: limit, total, totalPaginas: Math.ceil(total / limit) },
      message: 'Listado obtenido'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const limpiar = async (req, res) => {
  try {
    const meses = parseInt(req.query.meses, 10) || BITACORA.RETENCION_MESES;
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - meses);

    const filter = { createdAt: { $lt: fechaLimite } };
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;

    const resultado = await Bitacora.deleteMany(filter);

    res.json({
      ok: true,
      data: {
        meses,
        fechaLimite,
        registrosEliminados: resultado.deletedCount
      },
      message: `Se eliminaron ${resultado.deletedCount} registros de bitácora anteriores a ${meses} meses`
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al limpiar bitácora', error: error.message });
  }
};

module.exports = { getAll, getById, getByUsuario, limpiar };
