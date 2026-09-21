const Notificacion = require('../models/Notificacion');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total, noLeidas] = await Promise.all([
      Notificacion.find({ usuarioId: req.usuario._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notificacion.countDocuments({ usuarioId: req.usuario._id }),
      Notificacion.countDocuments({ usuarioId: req.usuario._id, leida: false })
    ]);

    res.json({
      ok: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      noLeidas
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar notificaciones', error: error.message });
  }
};

const marcarLeida = async (req, res) => {
  try {
    const notif = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, usuarioId: req.usuario._id },
      { leida: true, fechaLectura: new Date() },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ ok: false, message: 'Notificación no encontrada' });
    }
    res.json({ ok: true, data: notif, message: 'Marcada como leída' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al marcar notificación', error: error.message });
  }
};

const marcarTodasLeidas = async (req, res) => {
  try {
    const result = await Notificacion.updateMany(
      { usuarioId: req.usuario._id, leida: false },
      { leida: true, fechaLectura: new Date() }
    );
    res.json({ ok: true, message: `${result.modifiedCount} notificaciones marcadas como leídas` });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al marcar notificaciones', error: error.message });
  }
};

const crear = async (req, res) => {
  try {
    const notif = await Notificacion.create({
      institucionId: req.usuario.institucionId,
      usuarioId: req.body.usuarioId,
      titulo: req.body.titulo,
      mensaje: req.body.mensaje,
      tipo: req.body.tipo || 'sistema',
      enlace: req.body.enlace
    });
    res.status(201).json({ ok: true, data: notif, message: 'Notificación creada' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al crear notificación', error: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const notif = await Notificacion.findOneAndDelete({
      _id: req.params.id,
      usuarioId: req.usuario._id
    });
    if (!notif) {
      return res.status(404).json({ ok: false, message: 'Notificación no encontrada' });
    }
    res.json({ ok: true, message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar notificación', error: error.message });
  }
};

module.exports = { getAll, marcarLeida, marcarTodasLeidas, crear, eliminar };
