const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');

async function notificarSuperAdmins({ titulo, mensaje, tipo = 'sistema', enlace, institucionId, excludeUserId }) {
  try {
    const filtro = { tipoPerfil: 'super_admin', estado: 'activo' };
    if (excludeUserId) filtro._id = { $ne: excludeUserId };

    const superAdmins = await Usuario.find(filtro)
      .select('_id')
      .lean();

    if (!superAdmins.length) return;

    const notifs = superAdmins.map(sa => ({
      institucionId,
      usuarioId: sa._id,
      titulo,
      mensaje,
      tipo,
      enlace
    }));

    await Notificacion.insertMany(notifs);
  } catch (_) {
    // silenciar errores de notificación
  }
}

module.exports = { notificarSuperAdmins };
