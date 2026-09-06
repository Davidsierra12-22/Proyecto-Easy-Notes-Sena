const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');
const Bitacora = require('../models/Bitacora');
const { generarToken } = require('../middleware/auth');
const { enviarRecuperacion, configurado: smtpConfigurado } = require('../services/mailService');

const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ ok: false, message: 'Usuario y contraseña son requeridos' });
    }

    const criterio = { $or: [
      { 'credenciales.usuario': usuario },
      { documento: usuario }
    ] };
    const user = await Usuario.findOne(criterio);
    if (!user) {
      Bitacora.create({ accion: 'login_fallido', coleccion: 'Usuarios', detalle: `Usuario no encontrado: ${usuario}`, direccionIp: req.ip, metodo: 'POST', ruta: req.originalUrl }).catch(() => {});
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas' });
    }
    if (user.estado !== 'activo') {
      Bitacora.create({ institucionId: user.institucionId, usuarioId: user._id, accion: 'login_fallido', coleccion: 'Usuarios', registroId: user._id, detalle: `Usuario inactivo/bloqueado: ${usuario}`, direccionIp: req.ip, metodo: 'POST', ruta: req.originalUrl }).catch(() => {});
      return res.status(401).json({ ok: false, message: 'Usuario inactivo o bloqueado' });
    }

    const esValida = await user.comparePassword(password);
    if (!esValida) {
      Bitacora.create({ institucionId: user.institucionId, usuarioId: user._id, accion: 'login_fallido', coleccion: 'Usuarios', registroId: user._id, detalle: `Contrasena incorrecta: ${usuario}`, direccionIp: req.ip, metodo: 'POST', ruta: req.originalUrl }).catch(() => {});
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas' });
    }

    user.credenciales.ultimoLogin = new Date();
    await user.save();

    Bitacora.create({
      institucionId: user.institucionId,
      usuarioId: user._id,
      accion: 'login',
      coleccion: 'Usuarios',
      registroId: user._id,
      detalle: `Inicio de sesion exitoso`,
      direccionIp: req.ip,
      metodo: 'POST',
      ruta: req.originalUrl
    }).catch(() => {});

    const token = generarToken(user._id);

    const data = {
      token,
      usuario: {
        id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        nombreCompleto: user.nombreCompleto,
        documento: user.documento,
        email: user.email,
        tipoPerfil: user.tipoPerfil,
        institucionId: user.institucionId,
        nucleoId: user.nucleoId,
        debeCambiarPassword: user.credenciales.debeCambiarPassword,
        foto: user.foto
      }
    };

    res.json({ ok: true, data, message: 'Login exitoso' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al iniciar sesion', error: error.message });
  }
};

const me = async (req, res) => {
  try {
    res.json({ ok: true, data: req.usuario });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener perfil', error: error.message });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ ok: false, message: 'passwordActual y passwordNueva son requeridos' });
    }
    if (passwordNueva.length < 6) {
      return res.status(400).json({ ok: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await Usuario.findById(req.usuario._id);
    const esValida = await user.comparePassword(passwordActual);
    if (!esValida) {
      return res.status(401).json({ ok: false, message: 'La contraseña actual es incorrecta' });
    }

    user.credenciales.passwordHash = await Usuario.hashPassword(passwordNueva);
    user.credenciales.debeCambiarPassword = false;
    await user.save();

    Bitacora.create({
      institucionId: req.usuario.institucionId,
      usuarioId: req.usuario._id,
      accion: 'cambio_password',
      coleccion: 'Usuarios',
      registroId: req.usuario._id,
      detalle: 'Cambio de contraseña',
      direccionIp: req.ip,
      metodo: 'PUT',
      ruta: req.originalUrl
    }).catch(() => {});

    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al cambiar contraseña', error: error.message });
  }
};

const recuperarPassword = async (req, res) => {
  try {
    const { documento } = req.body;
    if (!documento) {
      return res.status(400).json({ ok: false, message: 'El documento es requerido' });
    }

    const user = await Usuario.findOne({ documento });
    const respuestaGenerica = { ok: true, message: 'Si el documento existe y tiene un correo registrado, recibira un link de recuperacion' };

    if (!user || user.estado !== 'activo') {
      return res.json(respuestaGenerica);
    }
    if (!user.email) {
      Bitacora.create({
        institucionId: user.institucionId,
        usuarioId: user._id,
        accion: 'recuperar_password_sin_email',
        coleccion: 'Usuarios',
        registroId: user._id,
        detalle: 'Usuario solicitó recuperación pero no tiene email registrado',
        direccionIp: req.ip,
        metodo: 'POST',
        ruta: req.originalUrl
      }).catch(() => {});
      return res.json(respuestaGenerica);
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.credenciales.tokenRecuperacion = token;
    user.credenciales.tokenRecuperacionExpira = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const enlace = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer-password?token=${token}`;
    let institucion = 'EasyNotes';
    try {
      const inst = await Institucion.findById(user.institucionId).select('nombre');
      if (inst) institucion = inst.nombre;
    } catch (_) { /* sin nombre institucional */ }

    try {
      await enviarRecuperacion({
        to: user.email,
        nombre: user.nombreCompleto || `${user.nombres} ${user.apellidos}`,
        enlace,
        expira: '1 hora',
        institucion
      });
      Bitacora.create({
        institucionId: user.institucionId,
        usuarioId: user._id,
        accion: 'recuperar_password',
        coleccion: 'Usuarios',
        registroId: user._id,
        detalle: `Link de recuperación enviado a ${user.email}`,
        direccionIp: req.ip,
        metodo: 'POST',
        ruta: req.originalUrl
      }).catch(() => {});
    } catch (error) {
      console.error(`[mail] No se pudo enviar el correo a ${user.email}:`, error.message);
      if (!smtpConfigurado) {
        console.log(`[mail] LINK DE RECUPERACIÓN (modo desarrollo): ${enlace}`);
      }
      Bitacora.create({
        institucionId: user.institucionId,
        usuarioId: user._id,
        accion: 'recuperar_password_envio_fallido',
        coleccion: 'Usuarios',
        registroId: user._id,
        detalle: error.codigo === 'RESEND_NO_CONFIGURADO'
          ? 'Resend no configurado, enlace logueado en consola'
          : `Fallo al enviar correo a ${user.email}: ${error.message}`,
        direccionIp: req.ip,
        metodo: 'POST',
        ruta: req.originalUrl
      }).catch(() => {});
    }

    res.json(respuestaGenerica);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al procesar recuperacion', error: error.message });
  }
};

const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword) {
      return res.status(400).json({ ok: false, message: 'Token y nuevaPassword son requeridos' });
    }
    if (nuevaPassword.length < 6) {
      return res.status(400).json({ ok: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await Usuario.findOne({
      'credenciales.tokenRecuperacion': token,
      'credenciales.tokenRecuperacionExpira': { $gt: new Date() }
    });

    if (!user) {
      Bitacora.create({ accion: 'restablecer_password_fallido', coleccion: 'Usuarios', detalle: 'Token invalido o expirado', direccionIp: req.ip, metodo: 'PUT', ruta: req.originalUrl }).catch(() => {});
      return res.status(400).json({ ok: false, message: 'Token invalido o expirado' });
    }

    user.credenciales.passwordHash = await Usuario.hashPassword(nuevaPassword);
    user.credenciales.tokenRecuperacion = undefined;
    user.credenciales.tokenRecuperacionExpira = undefined;
    user.credenciales.debeCambiarPassword = false;
    await user.save();

    Bitacora.create({
      institucionId: user.institucionId,
      usuarioId: user._id,
      accion: 'restablecer_password_exitoso',
      coleccion: 'Usuarios',
      registroId: user._id,
      detalle: 'Contrasena restablecida via token de recuperacion',
      direccionIp: req.ip,
      metodo: 'PUT',
      ruta: req.originalUrl
    }).catch(() => {});

    res.json({ ok: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al restablecer contraseña', error: error.message });
  }
};

module.exports = { login, me, cambiarPassword, recuperarPassword, restablecerPassword };
