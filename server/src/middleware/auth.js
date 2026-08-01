const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'easynots_secret_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ ok: false, message: 'No autorizado, token requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id)
      .select('-credenciales.passwordHash -credenciales.tokenRecuperacion -credenciales.tokenRecuperacionExpira');

    if (!usuario) {
      return res.status(401).json({ ok: false, message: 'Token invalido, usuario no existe' });
    }
    if (usuario.estado !== 'activo') {
      return res.status(401).json({ ok: false, message: 'Usuario inactivo o bloqueado' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Token invalido', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }
    if (!roles.includes(req.usuario.tipoPerfil)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para esta accion' });
    }
    next();
  };
};

const generarToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, JWT_SECRET, { expiresIn: '8h' });
};

module.exports = { protect, authorize, generarToken };
