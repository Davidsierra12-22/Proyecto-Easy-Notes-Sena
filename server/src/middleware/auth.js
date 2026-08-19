const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { MENSAJES } = require('../config/constants');

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

    req.usuario = usuario;
    next();
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

const generarToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, JWT_SECRET, { expiresIn: '8h' });
};

module.exports = { protect, authorize, generarToken };
