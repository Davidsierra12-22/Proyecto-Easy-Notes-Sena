const Usuario = require('../models/Usuario');
const { generarToken } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ ok: false, message: 'Usuario y contraseña son requeridos' });
    }

    const user = await Usuario.findOne({ 'credenciales.usuario': usuario });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas' });
    }
    if (user.estado !== 'activo') {
      return res.status(401).json({ ok: false, message: 'Usuario inactivo o bloqueado' });
    }

    const esValida = await user.comparePassword(password);
    if (!esValida) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas' });
    }

    user.credenciales.ultimoLogin = new Date();
    await user.save();

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

    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al cambiar contraseña', error: error.message });
  }
};

module.exports = { login, me, cambiarPassword };
