const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const { MENSAJES } = require('../config/constants');
const { restringirSuperAdmin } = require('./nucleoScope');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET no definido en variables de entorno');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ ok: false, message: MENSAJES.NO_AUTORIZADO });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id)
      .select('-credenciales.passwordHash -credenciales.tokenRecuperacion -credenciales.tokenRecuperacionExpira');

    if (!usuario) {
      return res.status(401).json({ ok: false, message: MENSAJES.TOKEN_INVALIDO });
    }
    if (usuario.estado !== 'activo') {
      return res.status(401).json({ ok: false, message: 'Usuario inactivo o bloqueado' });
    }

    // AU-002: si el token trae un perfil activo y está asignado al usuario, usar ese perfil en esta sesión
    if (decoded.tipoPerfil) {
      const perfiles = usuario.roles && usuario.roles.length ? usuario.roles : [usuario.tipoPerfil];
      if (perfiles.includes(decoded.tipoPerfil)) {
        usuario.tipoPerfil = decoded.tipoPerfil;
      }
    }

    // RN-AUTH-02B: Forzar cambio de contraseña en primer login
    // Excepción: permitir login y cambio de contraseña
    if (usuario.credenciales && usuario.credenciales.debeCambiarPassword) {
      const ruta = req.originalUrl;
      const esLogin = ruta === '/api/auth/login';
      const esCambioPassword = req.method === 'PUT' && ruta === '/api/auth/password';
      const esMe = ruta === '/api/auth/me';

      if (!esLogin && !esCambioPassword && !esMe) {
        return res.status(403).json({
          ok: false,
          message: 'Debes cambiar tu contraseña antes de continuar',
          debeCambiarPassword: true
        });
      }
    }

    req.usuario = usuario;
    return restringirSuperAdmin(req, res, next);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: MENSAJES.TOKEN_EXPIRADO });
    }
    return res.status(401).json({ ok: false, message: MENSAJES.TOKEN_INVALIDO, error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, message: MENSAJES.NO_AUTORIZADO });
    }
    if (!roles.includes(req.usuario.tipoPerfil)) {
      return res.status(403).json({ ok: false, message: MENSAJES.SIN_PERMISOS });
    }
    next();
  };
};

const generarToken = (usuarioId, tipoPerfil) => {
  const payload = { id: usuarioId };
  if (tipoPerfil) payload.tipoPerfil = tipoPerfil;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

/**
 * Acceso a documentos académicos de un estudiante (boletines, certificados):
 * - estudiante: solo su propio documento (fuerza su id, ignora el parámetro)
 * - acudiente: solo estudiantes en su lista de representados (acudientes)
 * - admin/rector/coordinador/secretaria/docente: solo estudiantes de su misma institución
 * - super_admin: sin ámbito institucional -> 403
 */
const autorizarAccesoEstudiante = () => {
  return async (req, res, next) => {
    try {
      const perfil = req.usuario.tipoPerfil;
      const propietario = ['estudiante', 'acudiente'].includes(perfil);

      if (perfil === 'estudiante') {
        req.params.estudianteId = req.usuario._id.toString();
        return next();
      }

      const { estudianteId } = req.params;
      if (!estudianteId || !mongoose.isValidObjectId(estudianteId)) {
        return res.status(400).json({ ok: false, message: MENSAJES.PARAMETROS_INVALIDOS });
      }

      if (perfil === 'super_admin' && !propietario) {
        return res.status(403).json({ ok: false, message: MENSAJES.SIN_PERMISOS });
      }

      const estudiante = await Usuario.findById(estudianteId).select('institucionId estado acudientes');
      if (!estudiante) {
        return res.status(404).json({ ok: false, message: MENSAJES.NO_ENCONTRADO });
      }

      if (perfil === 'acudiente') {
        const esRepresentado = (estudiante.acudientes || []).some(
          a => a.acudienteId && a.acudienteId.toString() === req.usuario._id.toString()
        );
        if (!esRepresentado) {
          return res.status(403).json({ ok: false, message: MENSAJES.SIN_PERMISOS });
        }
        return next();
      }

      // Roles institucionales y docentes: misma institución
      if (estudiante.institucionId?.toString() !== req.usuario.institucionId?.toString()) {
        return res.status(403).json({ ok: false, message: MENSAJES.SIN_PERMISOS });
      }

      next();
    } catch (error) {
      return res.status(500).json({ ok: false, message: 'Error al verificar acceso al estudiante', error: error.message });
    }
  };
};

module.exports = { protect, authorize, generarToken, autorizarAccesoEstudiante };
